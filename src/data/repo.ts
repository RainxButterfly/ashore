/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/data/repo.ts
 * @描述    数据仓库：用事务封装考试/考点/错题/复习流程，并提供备份与恢复。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { endOfDay } from '../core/dates';
import { createId } from '../core/id';
import type { OutlineDraft } from '../core/outline';
import { masteryAfterMistake, masteryAfterRating } from '../core/readiness';
import { createInitialSchedule, scheduleNext } from '../core/scheduler';
import type {
  Exam,
  ExamDraft,
  ExportBundle,
  Mistake,
  MistakeDraft,
  MistakeStatus,
  Rating,
  ReviewCard,
  ReviewItem,
  ReviewLog,
  SyllabusNode,
  ThemeMode,
} from '../core/types';
import { db } from './db';

export const SETTING_KEYS = {
  theme: 'theme',
  activeExamId: 'activeExamId',
  lastExportAt: 'lastExportAt',
} as const;

export interface NodeInput {
  title: string;
  weight: number;
  mastery: number;
  parentId: string | null;
  order?: number;
}

export interface DataCounts {
  exams: number;
  nodes: number;
  mistakes: number;
  reviewItems: number;
  reviewLogs: number;
}

function nowIso(now = new Date()): string {
  return now.toISOString();
}

function clampWeight(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

function clampMastery(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const record = await db.settings.get(key);
  return record ? (record.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

export async function listExams(): Promise<Exam[]> {
  return db.exams.orderBy('createdAt').toArray();
}

export async function createExam(draft: ExamDraft): Promise<Exam> {
  const timestamp = nowIso();
  const exam: Exam = {
    id: createId(),
    name: draft.name.trim(),
    category: draft.category,
    examDate: draft.examDate,
    targetScore: draft.targetScore,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.exams.add(exam);

  const activeExamId = await getSetting<string | null>(SETTING_KEYS.activeExamId, null);
  if (!activeExamId) {
    await setSetting(SETTING_KEYS.activeExamId, exam.id);
  }

  return exam;
}

export async function updateExam(id: string, draft: ExamDraft): Promise<Exam> {
  const existing = await db.exams.get(id);
  if (!existing) {
    throw new Error('找不到这场考试');
  }

  const next: Exam = {
    ...existing,
    name: draft.name.trim(),
    category: draft.category,
    examDate: draft.examDate,
    targetScore: draft.targetScore,
    updatedAt: nowIso(),
  };

  await db.exams.put(next);
  return next;
}

export async function deleteExam(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.exams, db.nodes, db.mistakes, db.reviewItems, db.reviewLogs, db.settings],
    async () => {
      await db.reviewLogs.where('examId').equals(id).delete();
      await db.reviewItems.where('examId').equals(id).delete();
      await db.mistakes.where('examId').equals(id).delete();
      await db.nodes.where('examId').equals(id).delete();
      await db.exams.delete(id);

      const activeRecord = await db.settings.get(SETTING_KEYS.activeExamId);
      if (activeRecord?.value === id) {
        const nextExam = await db.exams.orderBy('createdAt').first();
        if (nextExam) {
          await db.settings.put({ key: SETTING_KEYS.activeExamId, value: nextExam.id });
        } else {
          await db.settings.delete(SETTING_KEYS.activeExamId);
        }
      }
    },
  );
}

export async function listNodes(examId: string): Promise<SyllabusNode[]> {
  return db.nodes.where('examId').equals(examId).sortBy('order');
}

export async function createNode(examId: string, input: NodeInput): Promise<SyllabusNode> {
  const siblings = await db.nodes
    .where('examId')
    .equals(examId)
    .filter((node) => node.parentId === input.parentId)
    .toArray();

  const maxOrder = siblings.reduce((max, node) => Math.max(max, node.order), -1);
  const timestamp = nowIso();
  const node: SyllabusNode = {
    id: createId(),
    examId,
    parentId: input.parentId,
    title: input.title.trim(),
    weight: clampWeight(input.weight),
    mastery: clampMastery(input.mastery),
    order: input.order ?? maxOrder + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.nodes.add(node);
  return node;
}

export async function updateNode(
  id: string,
  patch: Partial<Pick<SyllabusNode, 'title' | 'weight' | 'mastery' | 'parentId' | 'order'>>,
): Promise<SyllabusNode> {
  const existing = await db.nodes.get(id);
  if (!existing) {
    throw new Error('找不到这个考点');
  }

  const next: SyllabusNode = {
    ...existing,
    ...patch,
    title: patch.title?.trim() ?? existing.title,
    weight: patch.weight === undefined ? existing.weight : clampWeight(patch.weight),
    mastery: patch.mastery === undefined ? existing.mastery : clampMastery(patch.mastery),
    updatedAt: nowIso(),
  };

  await db.nodes.put(next);
  return next;
}

export async function deleteNode(id: string): Promise<void> {
  await db.transaction('rw', [db.nodes, db.mistakes], async () => {
    const node = await db.nodes.get(id);
    if (!node) {
      return;
    }

    await db.nodes.where('parentId').equals(id).modify({
      parentId: node.parentId,
      updatedAt: nowIso(),
    });
    await db.mistakes.where('nodeId').equals(id).modify({
      nodeId: null,
      updatedAt: nowIso(),
    });
    await db.nodes.delete(id);
  });
}

export async function importNodes(examId: string, drafts: OutlineDraft[]): Promise<number> {
  if (drafts.length === 0) {
    return 0;
  }

  const existingNodes = await db.nodes.where('examId').equals(examId).toArray();
  const baseOrder = existingNodes.reduce((max, node) => Math.max(max, node.order), -1) + 1;
  const timestamp = nowIso();
  const ids = drafts.map(() => createId());

  const nodes: SyllabusNode[] = drafts.map((draft, index) => {
    const id = ids[index];
    if (!id) {
      throw new Error('生成考点编号失败');
    }

    return {
      id,
      examId,
      parentId: draft.parentIndex === null ? null : (ids[draft.parentIndex] ?? null),
      title: draft.title.trim(),
      weight: clampWeight(draft.weight),
      mastery: 0,
      order: baseOrder + index,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  await db.nodes.bulkAdd(nodes);
  return nodes.length;
}

export async function listMistakes(examId: string): Promise<Mistake[]> {
  const mistakes = await db.mistakes.where('examId').equals(examId).toArray();
  return mistakes.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listReviewItems(examId: string): Promise<ReviewItem[]> {
  return db.reviewItems.where('examId').equals(examId).toArray();
}

export async function createMistake(examId: string, draft: MistakeDraft): Promise<Mistake> {
  const now = new Date();
  const timestamp = now.toISOString();
  const mistake: Mistake = {
    id: createId(),
    examId,
    nodeId: draft.nodeId,
    content: draft.content.trim(),
    answer: draft.answer.trim(),
    analysis: draft.analysis.trim(),
    source: draft.source.trim(),
    tags: draft.tags,
    imageDataUrl: draft.imageDataUrl,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const initial = createInitialSchedule(now);
  const reviewItem: ReviewItem = {
    id: createId(),
    examId,
    mistakeId: mistake.id,
    dueAt: initial.dueAt,
    ease: initial.ease,
    intervalDays: initial.intervalDays,
    reps: initial.reps,
    lapses: initial.lapses,
    lastReviewedAt: initial.lastReviewedAt,
    createdAt: timestamp,
  };

  await db.transaction('rw', [db.mistakes, db.reviewItems, db.nodes], async () => {
    await db.mistakes.add(mistake);
    await db.reviewItems.add(reviewItem);

    if (mistake.nodeId) {
      const node = await db.nodes.get(mistake.nodeId);
      if (node) {
        await db.nodes.put({
          ...node,
          mastery: masteryAfterMistake(node.mastery),
          updatedAt: timestamp,
        });
      }
    }
  });

  return mistake;
}

export async function updateMistake(id: string, draft: MistakeDraft): Promise<Mistake> {
  const existing = await db.mistakes.get(id);
  if (!existing) {
    throw new Error('找不到这道错题');
  }

  const next: Mistake = {
    ...existing,
    nodeId: draft.nodeId,
    content: draft.content.trim(),
    answer: draft.answer.trim(),
    analysis: draft.analysis.trim(),
    source: draft.source.trim(),
    tags: draft.tags,
    imageDataUrl: draft.imageDataUrl,
    updatedAt: nowIso(),
  };

  await db.mistakes.put(next);
  return next;
}

export async function setMistakeStatus(id: string, status: MistakeStatus): Promise<void> {
  await db.mistakes.update(id, { status, updatedAt: nowIso() });
}

export async function deleteMistake(id: string): Promise<void> {
  await db.transaction('rw', [db.mistakes, db.reviewItems], async () => {
    await db.reviewItems.where('mistakeId').equals(id).delete();
    await db.mistakes.delete(id);
  });
}

export async function getDueCards(examId: string, now = new Date()): Promise<ReviewCard[]> {
  const dueBefore = endOfDay(now).getTime();
  const items = await db.reviewItems.where('examId').equals(examId).toArray();
  const dueItems = items
    .filter((item) => new Date(item.dueAt).getTime() <= dueBefore)
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime());

  if (dueItems.length === 0) {
    return [];
  }

  const loadedMistakes = await db.mistakes.bulkGet(dueItems.map((item) => item.mistakeId));
  const mistakeById = new Map(
    loadedMistakes
      .filter((mistake): mistake is Mistake => Boolean(mistake))
      .map((mistake) => [mistake.id, mistake]),
  );

  const nodeIds = [
    ...new Set(
      [...mistakeById.values()]
        .map((mistake) => mistake.nodeId)
        .filter((nodeId): nodeId is string => Boolean(nodeId)),
    ),
  ];
  const loadedNodes = nodeIds.length > 0 ? await db.nodes.bulkGet(nodeIds) : [];
  const nodeById = new Map(
    loadedNodes
      .filter((node): node is SyllabusNode => Boolean(node))
      .map((node) => [node.id, node]),
  );

  const cards: ReviewCard[] = [];
  for (const item of dueItems) {
    const mistake = mistakeById.get(item.mistakeId);
    if (!mistake || mistake.status !== 'active') {
      continue;
    }

    cards.push({
      item,
      mistake,
      node: mistake.nodeId ? (nodeById.get(mistake.nodeId) ?? null) : null,
    });
  }

  return cards;
}

export async function getNextDueAt(examId: string, now = new Date()): Promise<string | null> {
  const items = await db.reviewItems.where('examId').equals(examId).toArray();
  const nowMs = now.getTime();
  const futureItems = items
    .filter((item) => new Date(item.dueAt).getTime() > nowMs)
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime());

  for (const item of futureItems) {
    const mistake = await db.mistakes.get(item.mistakeId);
    if (mistake?.status === 'active') {
      return item.dueAt;
    }
  }

  return null;
}

export async function rateReview(
  itemId: string,
  rating: Rating,
  elapsedMs: number,
  now = new Date(),
): Promise<ReviewItem> {
  return db.transaction('rw', [db.reviewItems, db.reviewLogs, db.mistakes, db.nodes], async () => {
    const item = await db.reviewItems.get(itemId);
    if (!item) {
      throw new Error('这条复习记录不存在');
    }

    const mistake = await db.mistakes.get(item.mistakeId);
    if (!mistake) {
      throw new Error('关联的错题已被删除');
    }

    const scheduled = scheduleNext(item, rating, now);
    const next: ReviewItem = {
      ...item,
      ease: scheduled.ease,
      intervalDays: scheduled.intervalDays,
      reps: scheduled.reps,
      lapses: scheduled.lapses,
      dueAt: scheduled.dueAt,
      lastReviewedAt: scheduled.lastReviewedAt,
    };

    await db.reviewItems.put(next);

    const log: ReviewLog = {
      id: createId(),
      examId: item.examId,
      itemId: item.id,
      mistakeId: item.mistakeId,
      rating,
      reviewedAt: scheduled.lastReviewedAt ?? now.toISOString(),
      elapsedMs,
    };
    await db.reviewLogs.add(log);

    if (mistake.nodeId) {
      const node = await db.nodes.get(mistake.nodeId);
      if (node) {
        await db.nodes.put({
          ...node,
          mastery: masteryAfterRating(node.mastery, rating),
          updatedAt: now.toISOString(),
        });
      }
    }

    return next;
  });
}

export async function listReviewLogs(examId: string): Promise<ReviewLog[]> {
  const logs = await db.reviewLogs.where('examId').equals(examId).toArray();
  return logs.sort((left, right) => right.reviewedAt.localeCompare(left.reviewedAt));
}

export async function getDataCounts(): Promise<DataCounts> {
  const [exams, nodes, mistakes, reviewItems, reviewLogs] = await Promise.all([
    db.exams.count(),
    db.nodes.count(),
    db.mistakes.count(),
    db.reviewItems.count(),
    db.reviewLogs.count(),
  ]);

  return { exams, nodes, mistakes, reviewItems, reviewLogs };
}

export async function exportAll(): Promise<ExportBundle> {
  const [exams, nodes, mistakes, reviewItems, reviewLogs] = await Promise.all([
    db.exams.toArray(),
    db.nodes.toArray(),
    db.mistakes.toArray(),
    db.reviewItems.toArray(),
    db.reviewLogs.toArray(),
  ]);

  return {
    app: 'ashore',
    schemaVersion: 1,
    exportedAt: nowIso(),
    data: { exams, nodes, mistakes, reviewItems, reviewLogs },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

function isDateString(value: unknown): value is string {
  return isString(value) && !Number.isNaN(new Date(value).getTime());
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => isString(item));
}

export function parseImportBundle(raw: string): ExportBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('备份文件不是有效的 JSON');
  }

  if (!isRecord(parsed) || parsed.app !== 'ashore' || parsed.schemaVersion !== 1) {
    throw new Error('备份文件格式不正确，或版本不受支持');
  }

  if (!isRecord(parsed.data)) {
    throw new Error('备份文件缺少数据内容');
  }

  const tableNames = ['exams', 'nodes', 'mistakes', 'reviewItems', 'reviewLogs'] as const;
  const validators: Record<(typeof tableNames)[number], (row: Record<string, unknown>) => boolean> =
    {
      exams: (row) =>
        isNonEmptyString(row.id) &&
        isString(row.name) &&
        isString(row.category) &&
        isDateString(row.examDate) &&
        isNullableNumber(row.targetScore) &&
        isDateString(row.createdAt) &&
        isDateString(row.updatedAt),
      nodes: (row) =>
        isNonEmptyString(row.id) &&
        isNonEmptyString(row.examId) &&
        isNullableString(row.parentId) &&
        isString(row.title) &&
        isNumber(row.weight) &&
        isNumber(row.mastery) &&
        row.mastery >= 0 &&
        row.mastery <= 1 &&
        isNumber(row.order) &&
        isDateString(row.createdAt) &&
        isDateString(row.updatedAt),
      mistakes: (row) =>
        isNonEmptyString(row.id) &&
        isNonEmptyString(row.examId) &&
        isNullableString(row.nodeId) &&
        isString(row.content) &&
        isString(row.answer) &&
        isString(row.analysis) &&
        isString(row.source) &&
        isStringArray(row.tags) &&
        (row.imageDataUrl === null ||
          (isString(row.imageDataUrl) && row.imageDataUrl.startsWith('data:image/'))) &&
        (row.status === 'active' || row.status === 'archived') &&
        isDateString(row.createdAt) &&
        isDateString(row.updatedAt),
      reviewItems: (row) =>
        isNonEmptyString(row.id) &&
        isNonEmptyString(row.examId) &&
        isNonEmptyString(row.mistakeId) &&
        isDateString(row.dueAt) &&
        isNumber(row.ease) &&
        isNumber(row.intervalDays) &&
        isNumber(row.reps) &&
        isNumber(row.lapses) &&
        isNullableString(row.lastReviewedAt) &&
        isDateString(row.createdAt),
      reviewLogs: (row) =>
        isNonEmptyString(row.id) &&
        isNonEmptyString(row.examId) &&
        isNonEmptyString(row.itemId) &&
        isNonEmptyString(row.mistakeId) &&
        (row.rating === 1 || row.rating === 2 || row.rating === 3 || row.rating === 4) &&
        isDateString(row.reviewedAt) &&
        isNumber(row.elapsedMs),
    };

  for (const tableName of tableNames) {
    const rows = parsed.data[tableName];
    if (!Array.isArray(rows)) {
      throw new Error(`备份文件缺少数据表：${tableName}`);
    }

    const invalidIndex = rows.findIndex(
      (row: unknown) => !isRecord(row) || !validators[tableName](row),
    );

    if (invalidIndex >= 0) {
      throw new Error(`备份文件中的数据表 ${tableName} 第 ${invalidIndex + 1} 条格式不正确`);
    }
  }

  return parsed as unknown as ExportBundle;
}

export async function importAll(bundle: ExportBundle): Promise<void> {
  await db.transaction(
    'rw',
    [db.exams, db.nodes, db.mistakes, db.reviewItems, db.reviewLogs, db.settings],
    async () => {
      await db.reviewLogs.clear();
      await db.reviewItems.clear();
      await db.mistakes.clear();
      await db.nodes.clear();
      await db.exams.clear();

      if (bundle.data.exams.length > 0) {
        await db.exams.bulkAdd(bundle.data.exams);
      }
      if (bundle.data.nodes.length > 0) {
        await db.nodes.bulkAdd(bundle.data.nodes);
      }
      if (bundle.data.mistakes.length > 0) {
        await db.mistakes.bulkAdd(bundle.data.mistakes);
      }
      if (bundle.data.reviewItems.length > 0) {
        await db.reviewItems.bulkAdd(bundle.data.reviewItems);
      }
      if (bundle.data.reviewLogs.length > 0) {
        await db.reviewLogs.bulkAdd(bundle.data.reviewLogs);
      }

      const firstExam = bundle.data.exams[0];
      if (firstExam) {
        await db.settings.put({ key: SETTING_KEYS.activeExamId, value: firstExam.id });
      } else {
        await db.settings.delete(SETTING_KEYS.activeExamId);
      }
    },
  );
}

export async function clearAllData(): Promise<void> {
  const theme = await getSetting<ThemeMode>(SETTING_KEYS.theme, 'system');

  await db.transaction(
    'rw',
    [db.exams, db.nodes, db.mistakes, db.reviewItems, db.reviewLogs, db.settings],
    async () => {
      await db.reviewLogs.clear();
      await db.reviewItems.clear();
      await db.mistakes.clear();
      await db.nodes.clear();
      await db.exams.clear();
      await db.settings.clear();
      await db.settings.put({ key: SETTING_KEYS.theme, value: theme });
    },
  );
}
