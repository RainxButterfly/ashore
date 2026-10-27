/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/scheduler.ts
 * @描述    轻量间隔重复调度：在 SM-2 的基础上收敛参数，计算下次复习时间。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { addDays, addMinutes } from './dates';
import type { Rating } from './types';

export const RATING_LABELS: Record<Rating, string> = {
  1: '忘记',
  2: '困难',
  3: '记得',
  4: '简单',
};

export const RATING_HINTS: Record<Rating, string> = {
  1: '完全想不起来',
  2: '想起来一部分',
  3: '正常回忆起来',
  4: '毫不费力',
};

export interface ScheduleState {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
}

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
const MAX_INTERVAL_DAYS = 365;
const AGAIN_DELAY_MINUTES = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createInitialSchedule(now = new Date()): ScheduleState {
  return {
    ease: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    dueAt: now.toISOString(),
    lastReviewedAt: null,
  };
}

export function scheduleNext(
  state: ScheduleState,
  rating: Rating,
  now = new Date(),
): ScheduleState {
  const reviewedAt = now.toISOString();

  if (rating === 1) {
    return {
      ease: clamp(state.ease - 0.2, MIN_EASE, MAX_EASE),
      intervalDays: 0,
      reps: 0,
      lapses: state.lapses + 1,
      dueAt: addMinutes(now, AGAIN_DELAY_MINUTES).toISOString(),
      lastReviewedAt: reviewedAt,
    };
  }

  let ease = state.ease;
  let intervalDays: number;

  if (rating === 2) {
    ease = clamp(ease - 0.15, MIN_EASE, MAX_EASE);
    intervalDays = state.reps === 0 ? 1 : Math.round(state.intervalDays * 1.2);
  } else if (rating === 3) {
    intervalDays = state.reps === 0 ? 1 : Math.round(state.intervalDays * ease);
  } else {
    ease = clamp(ease + 0.15, MIN_EASE, MAX_EASE);
    intervalDays = state.reps === 0 ? 3 : Math.round(state.intervalDays * ease * 1.3);
  }

  intervalDays = clamp(intervalDays, 1, MAX_INTERVAL_DAYS);

  return {
    ease,
    intervalDays,
    reps: state.reps + 1,
    lapses: state.lapses,
    dueAt: addDays(now, intervalDays).toISOString(),
    lastReviewedAt: reviewedAt,
  };
}

export function intervalLabel(intervalDays: number): string {
  if (intervalDays <= 0) {
    return `${AGAIN_DELAY_MINUTES} 分钟`;
  }
  if (intervalDays < 30) {
    return `${intervalDays} 天`;
  }
  if (intervalDays < 365) {
    return `${Math.round(intervalDays / 30)} 个月`;
  }
  return '1 年';
}

export function previewSchedule(state: ScheduleState, now = new Date()): Record<Rating, string> {
  return {
    1: intervalLabel(scheduleNext(state, 1, now).intervalDays),
    2: intervalLabel(scheduleNext(state, 2, now).intervalDays),
    3: intervalLabel(scheduleNext(state, 3, now).intervalDays),
    4: intervalLabel(scheduleNext(state, 4, now).intervalDays),
  };
}
