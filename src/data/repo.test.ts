/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/data/repo.test.ts
 * @描述    数据层集成测试：示例数据、首次评分、错题入队与统计计数。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  clearAllData,
  createMistake,
  deleteNode,
  exportAll,
  getDataCounts,
  getDueCards,
  importAll,
  parseImportBundle,
  rateReview,
} from './repo';
import { seedSampleData } from './seed';

describe('data repository', () => {
  beforeEach(async () => {
    await db.open();
    await clearAllData();
  });

  afterAll(async () => {
    db.close();
    await db.delete();
  });

  it('seeds a complete sample exam', async () => {
    const examId = await seedSampleData();
    const counts = await getDataCounts();

    expect(counts.exams).toBe(1);
    expect(counts.nodes).toBeGreaterThan(10);
    expect(counts.mistakes).toBe(6);
    expect(counts.reviewLogs).toBeGreaterThan(20);

    const cards = await getDueCards(examId);
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it('schedules a rated card forward and records a log', async () => {
    const examId = await seedSampleData();
    const cards = await getDueCards(examId);
    const card = cards[0];

    expect(card).toBeDefined();
    if (!card) {
      return;
    }

    const logsBefore = await db.reviewLogs.count();
    const updated = await rateReview(card.item.id, 4, 42_000);

    expect(updated.reps).toBe(card.item.reps + 1);
    expect(new Date(updated.dueAt).getTime()).toBeGreaterThan(Date.now());
    expect(await db.reviewLogs.count()).toBe(logsBefore + 1);
  });

  it('puts a newly captured mistake into the queue immediately', async () => {
    const examId = await seedSampleData();
    const before = await getDueCards(examId);

    await createMistake(examId, {
      nodeId: null,
      content: '测试用错题',
      answer: '测试答案',
      analysis: '',
      source: '',
      tags: [],
      imageDataUrl: null,
    });

    const after = await getDueCards(examId);
    expect(after.length).toBe(before.length + 1);
  });

  it('round-trips an export through import', async () => {
    const examId = await seedSampleData();
    const before = await getDataCounts();
    const bundle = await exportAll();

    await clearAllData();
    await importAll(bundle);

    expect(await getDataCounts()).toEqual(before);
    expect((await getDueCards(examId)).length).toBeGreaterThan(0);
  });

  it('keeps child nodes and mistakes when a parent node is deleted', async () => {
    const examId = await seedSampleData();
    const parent = await db.nodes
      .where('examId')
      .equals(examId)
      .filter((node) => node.parentId === null && node.title === '数据结构')
      .first();
    const child = parent
      ? await db.nodes
          .where('examId')
          .equals(examId)
          .filter((node) => node.parentId === parent.id && node.title === '树与二叉树')
          .first()
      : undefined;

    expect(parent).toBeDefined();
    expect(child).toBeDefined();
    if (!parent || !child) {
      return;
    }

    await deleteNode(parent.id);

    const updatedChild = await db.nodes.get(child.id);
    const linkedMistakes = await db.mistakes.where('nodeId').equals(child.id).count();

    expect(updatedChild?.parentId).toBeNull();
    expect(linkedMistakes).toBe(1);
  });

  it('rejects malformed import rows', async () => {
    const timestamp = new Date().toISOString();
    const malformed = {
      app: 'ashore',
      schemaVersion: 1,
      exportedAt: timestamp,
      data: {
        exams: [],
        nodes: [],
        mistakes: [
          {
            id: 'mistake-1',
            examId: 'exam-1',
            nodeId: null,
            content: '测试',
            answer: '',
            analysis: '',
            source: '',
            tags: [],
            imageDataUrl: 'https://example.com/tracker.png',
            status: 'active',
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
        reviewItems: [],
        reviewLogs: [],
      },
    };

    expect(() => parseImportBundle(JSON.stringify(malformed))).toThrow('mistakes');
  });
});
