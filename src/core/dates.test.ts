/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/dates.test.ts
 * @描述    校验日期键、倒计时、连续复习与到期标签的边界行为。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { describe, expect, it } from 'vitest';
import { computeStreak, daysUntil, formatDueLabel, parseDateOnly, toDateKey } from './dates';

const now = new Date(2026, 9, 27, 21, 30);

function logAt(dayOffset: number): { reviewedAt: string } {
  return {
    reviewedAt: new Date(2026, 9, 27 + dayOffset, 12, 0).toISOString(),
  };
}

describe('dates', () => {
  it('uses local calendar days for date keys', () => {
    expect(toDateKey(now)).toBe('2026-10-27');
  });

  it('rejects impossible calendar dates', () => {
    expect(parseDateOnly('2026-02-30')).toBeNull();
    expect(parseDateOnly('2026-13-01')).toBeNull();
    expect(parseDateOnly('2026-12-19')?.getDate()).toBe(19);
  });

  it('counts calendar days until the exam', () => {
    expect(daysUntil('2026-12-19', now)).toBe(53);
    expect(daysUntil('2026-10-26', now)).toBe(-1);
    expect(daysUntil('2026-10-27', now)).toBe(0);
    expect(daysUntil('not-a-date', now)).toBeNull();
  });

  it('keeps a streak when today or yesterday is reviewed', () => {
    expect(computeStreak([logAt(0), logAt(-1), logAt(-2), logAt(-4)], now)).toBe(3);
    expect(computeStreak([logAt(-1), logAt(-2)], now)).toBe(2);
    expect(computeStreak([logAt(-2)], now)).toBe(0);
    expect(computeStreak([], now)).toBe(0);
  });

  it('formats due labels for the next week', () => {
    expect(formatDueLabel(new Date(2026, 9, 27, 23, 0).toISOString(), now)).toBe('今天');
    expect(formatDueLabel(new Date(2026, 9, 28, 9, 0).toISOString(), now)).toBe('明天');
    expect(formatDueLabel(new Date(2026, 9, 30, 9, 0).toISOString(), now)).toBe('3 天后');
    expect(formatDueLabel(new Date(2026, 9, 20, 9, 0).toISOString(), now)).toBe('7 天前');
  });
});
