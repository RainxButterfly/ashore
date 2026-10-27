/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/outline.test.ts
 * @描述    校验缩进/标题大纲与 CSV 的解析、父级解析和环路保护。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { describe, expect, it } from 'vitest';
import { csvRowsToDrafts, outlineToDrafts, parseCsv, parseOutline } from './outline';

describe('outline import', () => {
  it('parses indentation, headings, bullets and weights', () => {
    const lines = parseOutline(`数据结构 | 5
  线性表 | 4
  - 树
    二叉树
# 操作系统 | 5
  进程管理`);

    expect(lines.map((line) => line.title)).toEqual([
      '数据结构',
      '线性表',
      '树',
      '二叉树',
      '操作系统',
      '进程管理',
    ]);
    expect(lines.map((line) => line.depth)).toEqual([0, 1, 1, 2, 0, 1]);
    expect(lines[0]?.weight).toBe(5);
    expect(lines[2]?.weight).toBe(3);
  });

  it('converts outline lines into parent indexes', () => {
    const drafts = outlineToDrafts(
      parseOutline(`数据结构
  线性表
  树
    二叉树
操作系统
  进程管理`),
    );

    expect(drafts[1]?.parentIndex).toBe(0);
    expect(drafts[2]?.parentIndex).toBe(0);
    expect(drafts[3]?.parentIndex).toBe(2);
    expect(drafts[4]?.parentIndex).toBeNull();
    expect(drafts[5]?.parentIndex).toBe(4);
  });

  it('parses CSV with a header, quoted commas and weights', () => {
    const rows = parseCsv(`标题,父级,权重
数据结构,,5
线性表,数据结构,4
"树, 二叉树",数据结构,7`);

    expect(rows).toHaveLength(3);
    expect(rows[2]?.title).toBe('树, 二叉树');
    expect(rows[2]?.weight).toBe(5);

    const drafts = csvRowsToDrafts(rows);
    expect(drafts[0]?.parentIndex).toBeNull();
    expect(drafts[1]?.parentIndex).toBe(0);
    expect(drafts[2]?.parentIndex).toBe(0);
  });

  it('falls back to positional columns without a header', () => {
    const rows = parseCsv(`数据结构,,5
线性表,数据结构,4`);

    expect(rows).toHaveLength(2);
    expect(rows[1]?.parentTitle).toBe('数据结构');
  });

  it('breaks parent cycles instead of creating invalid trees', () => {
    const drafts = csvRowsToDrafts(
      parseCsv(`标题,父级,权重
A,B,3
B,A,3`),
    );

    expect(drafts[0]?.parentIndex).toBeNull();
    expect(drafts[1]?.parentIndex).toBeNull();
  });
});
