/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/readiness.test.ts
 * @描述    校验加权上岸指数、覆盖率、薄弱点排序与掌握度更新。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { describe, expect, it } from 'vitest';
import {
  computeCoverage,
  computeReadiness,
  getWeakNodes,
  masteryAfterMistake,
  masteryAfterRating,
  masteryTone,
} from './readiness';

describe('readiness', () => {
  it('weights mastery by syllabus importance', () => {
    expect(
      computeReadiness([
        { weight: 5, mastery: 0.8 },
        { weight: 5, mastery: 0.2 },
      ]),
    ).toBeCloseTo(0.5);

    expect(
      computeReadiness([
        { weight: 1, mastery: 1 },
        { weight: 9, mastery: 0 },
      ]),
    ).toBeCloseTo(0.1);

    expect(computeReadiness([])).toBe(0);
  });

  it('reports coverage above a mastery threshold', () => {
    expect(computeCoverage([{ mastery: 0.8 }, { mastery: 0.5 }, { mastery: 0.49 }])).toEqual({
      covered: 2,
      total: 3,
      ratio: 2 / 3,
    });
  });

  it('puts low-mastery, high-weight nodes first', () => {
    const weak = getWeakNodes(
      [
        { title: 'A', mastery: 0.2, weight: 3 },
        { title: 'B', mastery: 0.2, weight: 5 },
        { title: 'C', mastery: 0.9, weight: 5 },
      ],
      2,
    );

    expect(weak.map((node) => node.title)).toEqual(['B', 'A']);
  });

  it('moves mastery within the 0–1 range', () => {
    expect(masteryAfterRating(0.5, 4)).toBeCloseTo(0.62);
    expect(masteryAfterRating(0.5, 1)).toBeCloseTo(0.38);
    expect(masteryAfterRating(0, 1)).toBe(0);
    expect(masteryAfterRating(1, 4)).toBe(1);
    expect(masteryAfterMistake(0.5)).toBeCloseTo(0.46);
    expect(masteryAfterMistake(0)).toBe(0);
  });

  it('maps mastery to a visual tone', () => {
    expect(masteryTone(0.2)).toBe('danger');
    expect(masteryTone(0.45)).toBe('warning');
    expect(masteryTone(0.5)).toBe('good');
    expect(masteryTone(0.8)).toBe('good');
  });
});
