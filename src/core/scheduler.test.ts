/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/scheduler.test.ts
 * @描述    校验间隔重复调度的评分顺序、遗忘重置与参数上下限。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { describe, expect, it } from 'vitest';
import {
  createInitialSchedule,
  previewSchedule,
  scheduleNext,
  type ScheduleState,
} from './scheduler';

const now = new Date('2026-10-27T12:00:00.000Z');

describe('scheduler', () => {
  it('gives new cards sensible first intervals', () => {
    const initial = createInitialSchedule(now);
    const hard = scheduleNext(initial, 2, now);
    const good = scheduleNext(initial, 3, now);
    const easy = scheduleNext(initial, 4, now);

    expect(hard.intervalDays).toBe(1);
    expect(good.intervalDays).toBe(1);
    expect(easy.intervalDays).toBe(3);
    expect(new Date(easy.dueAt).getTime()).toBeGreaterThan(new Date(good.dueAt).getTime());
  });

  it('resets a forgotten card to a short delay', () => {
    const mature: ScheduleState = {
      ease: 2.3,
      intervalDays: 20,
      reps: 4,
      lapses: 1,
      dueAt: now.toISOString(),
      lastReviewedAt: now.toISOString(),
    };

    const next = scheduleNext(mature, 1, now);

    expect(next.intervalDays).toBe(0);
    expect(next.reps).toBe(0);
    expect(next.lapses).toBe(2);
    expect(new Date(next.dueAt).getTime() - now.getTime()).toBe(10 * 60 * 1000);
  });

  it('increases intervals monotonically for successful reviews', () => {
    let state = createInitialSchedule(now);
    const intervals: number[] = [];

    for (let round = 0; round < 5; round += 1) {
      state = scheduleNext(state, 3, now);
      intervals.push(state.intervalDays);
    }

    expect(intervals).toEqual([...intervals].sort((left, right) => left - right));
    expect(new Set(intervals).size).toBeGreaterThan(2);
  });

  it('clamps ease and caps long intervals', () => {
    let state = createInitialSchedule(now);

    for (let round = 0; round < 30; round += 1) {
      state = scheduleNext(state, 4, now);
    }

    expect(state.ease).toBe(2.8);
    expect(state.intervalDays).toBeLessThanOrEqual(365);

    let forgotten: ScheduleState = state;
    for (let round = 0; round < 20; round += 1) {
      forgotten = scheduleNext(forgotten, 1, now);
    }

    expect(forgotten.ease).toBe(1.3);
  });

  it('previews intervals for every rating', () => {
    const preview = previewSchedule(createInitialSchedule(now), now);

    expect(preview[1]).toBe('10 分钟');
    expect(preview[2]).toBe('1 天');
    expect(preview[3]).toBe('1 天');
    expect(preview[4]).toBe('3 天');
  });
});
