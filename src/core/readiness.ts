/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/readiness.ts
 * @描述    掌握度与上岸指数：按考点权重汇总掌握度，并给出覆盖率和薄弱点。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import type { Rating, SyllabusNode } from './types';

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function computeReadiness(nodes: Pick<SyllabusNode, 'weight' | 'mastery'>[]): number {
  const totalWeight = nodes.reduce((sum, node) => sum + Math.max(0, node.weight), 0);
  if (totalWeight === 0) {
    return 0;
  }

  const weightedMastery = nodes.reduce(
    (sum, node) => sum + Math.max(0, node.weight) * clamp01(node.mastery),
    0,
  );

  return clamp01(weightedMastery / totalWeight);
}

export interface Coverage {
  covered: number;
  total: number;
  ratio: number;
}

export function computeCoverage(nodes: Pick<SyllabusNode, 'mastery'>[], threshold = 0.5): Coverage {
  const total = nodes.length;
  const covered = nodes.filter((node) => clamp01(node.mastery) >= threshold).length;

  return {
    covered,
    total,
    ratio: total === 0 ? 0 : covered / total,
  };
}

export function getWeakNodes<T extends Pick<SyllabusNode, 'mastery' | 'weight'>>(
  nodes: T[],
  limit = 5,
): T[] {
  return [...nodes]
    .sort((left, right) => {
      const masteryDelta = clamp01(left.mastery) - clamp01(right.mastery);
      return masteryDelta !== 0 ? masteryDelta : right.weight - left.weight;
    })
    .slice(0, limit);
}

const MASTERY_DELTA: Record<Rating, number> = {
  1: -0.12,
  2: -0.05,
  3: 0.06,
  4: 0.12,
};

export function masteryAfterRating(current: number, rating: Rating): number {
  return clamp01(current + MASTERY_DELTA[rating]);
}

export function masteryAfterMistake(current: number): number {
  return clamp01(current - 0.04);
}

export function masteryTone(mastery: number): 'danger' | 'warning' | 'good' {
  const value = clamp01(mastery);
  if (value < 0.35) {
    return 'danger';
  }
  if (value < 0.5) {
    return 'warning';
  }
  return 'good';
}
