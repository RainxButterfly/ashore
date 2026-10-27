/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/dates.ts
 * @描述    本地日期工具：考试倒计时、日键、热力图区间与连续复习天数。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import type { ReviewLog } from './types';

const MS_PER_DAY = 86_400_000;

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
});

export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function daysUntil(dateOnly: string, now = new Date()): number | null {
  const target = parseDateOnly(dateOnly);
  if (!target) {
    return null;
  }

  const today = startOfDay(now);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((targetUtc - todayUtc) / MS_PER_DAY);
}

export function formatDate(dateOnly: string): string {
  const date = parseDateOnly(dateOnly);
  return date ? dateFormatter.format(date) : dateOnly;
}

export function formatShortDate(value: string): string {
  const date = value.length > 10 ? new Date(value) : parseDateOnly(value);
  return date && !Number.isNaN(date.getTime()) ? shortDateFormatter.format(date) : value;
}

export function getGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 11) {
    return '早上好';
  }
  if (hour >= 11 && hour < 13) {
    return '中午好';
  }
  if (hour >= 13 && hour < 18) {
    return '下午好';
  }
  return '晚上好';
}

export function computeStreak(logs: Pick<ReviewLog, 'reviewedAt'>[], now = new Date()): number {
  if (logs.length === 0) {
    return 0;
  }

  const reviewedDays = new Set(logs.map((log) => toDateKey(new Date(log.reviewedAt))));
  let cursor = startOfDay(now);

  if (!reviewedDays.has(toDateKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!reviewedDays.has(toDateKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (reviewedDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function lastNDays(count: number, now = new Date()): string[] {
  const days: string[] = [];
  const today = startOfDay(now);

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(toDateKey(addDays(today, -offset)));
  }

  return days;
}

export function formatDueLabel(iso: string, now = new Date()): string {
  const due = new Date(iso);
  const diffDays = Math.round(
    (Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      MS_PER_DAY,
  );

  if (diffDays === 0) {
    return '今天';
  }
  if (diffDays === 1) {
    return '明天';
  }
  if (diffDays === -1) {
    return '昨天';
  }
  if (diffDays > 1 && diffDays <= 7) {
    return `${diffDays} 天后`;
  }
  if (diffDays < -1 && diffDays >= -7) {
    return `${Math.abs(diffDays)} 天前`;
  }
  return formatShortDate(iso);
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} 秒`;
  }

  return seconds === 0 ? `${minutes} 分钟` : `${minutes} 分 ${seconds} 秒`;
}
