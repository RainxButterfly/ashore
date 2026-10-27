/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/outline.ts
 * @描述    大纲导入解析：支持缩进/标题文本与 CSV，输出可直接落库的父子草稿。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
export interface OutlineLine {
  title: string;
  weight: number;
  depth: number;
}

export interface OutlineDraft {
  title: string;
  weight: number;
  parentIndex: number | null;
}

export interface CsvRow {
  title: string;
  parentTitle: string;
  weight: number;
}

const WEIGHT_SUFFIX = /\s*(?:\||｜)\s*([1-5])\s*$/;
const WEIGHT_PAREN_SUFFIX = /\s*[（(]\s*权重\s*([1-5])\s*[）)]\s*$/;
const HEADING_PREFIX = /^(#{1,6})\s+(.+)$/;
const BULLET_PREFIX = /^[-*+·]\s+/;

function parseWeight(raw: string): { title: string; weight: number } {
  const suffixMatch = WEIGHT_SUFFIX.exec(raw) ?? WEIGHT_PAREN_SUFFIX.exec(raw);
  if (!suffixMatch) {
    return { title: raw.trim(), weight: 3 };
  }

  return {
    title: raw.slice(0, suffixMatch.index).trim(),
    weight: Number(suffixMatch[1]),
  };
}

function countIndentDepth(prefix: string): number {
  let spaces = 0;
  for (const char of prefix) {
    spaces += char === '\t' ? 2 : 1;
  }
  return Math.floor(spaces / 2);
}

export function parseOutline(text: string): OutlineLine[] {
  const lines: OutlineLine[] = [];
  let lastDepth = -1;

  for (const rawLine of text.replace(/\r/g, '').split('\n')) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('<!--')) {
      continue;
    }

    const headingMatch = HEADING_PREFIX.exec(trimmed);
    let depth: number;
    let content: string;

    if (headingMatch) {
      depth = (headingMatch[1]?.length ?? 1) - 1;
      content = headingMatch[2] ?? '';
    } else {
      const indentMatch = /^([ \t]*)(.*)$/.exec(line);
      depth = countIndentDepth(indentMatch?.[1] ?? '');
      content = indentMatch?.[2] ?? '';
    }

    content = content.replace(BULLET_PREFIX, '').trim();
    if (!content) {
      continue;
    }

    const { title, weight } = parseWeight(content);
    if (!title) {
      continue;
    }

    depth = Math.min(depth, lastDepth + 1);
    lines.push({ title, weight, depth });
    lastDepth = depth;
  }

  return lines;
}

export function outlineToDrafts(lines: OutlineLine[]): OutlineDraft[] {
  const drafts: OutlineDraft[] = [];
  const stack: number[] = [];

  for (const line of lines) {
    const depth = Math.max(0, line.depth);
    const parentIndex = depth === 0 ? null : (stack[depth - 1] ?? null);

    const index = drafts.length;
    drafts.push({ title: line.title, weight: line.weight, parentIndex });
    stack.length = Math.min(stack.length, depth);
    stack[depth] = index;
  }

  return drafts;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function findColumn(header: string[], names: string[], fallback: number): number {
  const normalized = header.map((cell) => cell.trim().toLowerCase());
  const index = normalized.findIndex((cell) => names.includes(cell));
  return index >= 0 ? index : fallback;
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const firstRow = splitCsvLine(lines[0] ?? '');
  const hasHeader = firstRow.some((cell) =>
    ['标题', '名称', 'title', '父级', '上级', 'parent', '权重', 'weight'].includes(
      cell.trim().toLowerCase(),
    ),
  );

  const header = hasHeader ? firstRow : ['标题', '父级', '权重'];
  const titleIndex = findColumn(header, ['标题', '名称', 'title'], 0);
  const parentIndex = findColumn(header, ['父级', '上级', 'parent'], 1);
  const weightIndex = findColumn(header, ['权重', 'weight'], 2);
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const rows: CsvRow[] = [];

  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const title = (cells[titleIndex] ?? '').trim();
    if (!title) {
      continue;
    }

    const weight = Number((cells[weightIndex] ?? '').trim());
    rows.push({
      title,
      parentTitle: (cells[parentIndex] ?? '').trim(),
      weight: Number.isFinite(weight) ? Math.min(5, Math.max(1, weight)) : 3,
    });
  }

  return rows;
}

export function csvRowsToDrafts(rows: CsvRow[]): OutlineDraft[] {
  const indexByTitle = new Map<string, number>();

  rows.forEach((row, index) => {
    if (!indexByTitle.has(row.title)) {
      indexByTitle.set(row.title, index);
    }
  });

  const drafts: OutlineDraft[] = rows.map((row) => ({
    title: row.title,
    weight: row.weight,
    parentIndex: row.parentTitle ? (indexByTitle.get(row.parentTitle) ?? null) : null,
  }));

  return drafts.map((draft, index) => {
    let cursor = draft.parentIndex;
    const seen = new Set<number>();

    while (cursor !== null) {
      if (cursor === index || seen.has(cursor)) {
        return { ...draft, parentIndex: null };
      }
      seen.add(cursor);
      cursor = drafts[cursor]?.parentIndex ?? null;
    }

    return draft;
  });
}
