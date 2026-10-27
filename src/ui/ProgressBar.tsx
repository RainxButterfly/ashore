/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/ProgressBar.tsx
 * @描述    进度条：用于考点掌握度、今日队列与覆盖率展示。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import clsx from 'clsx';
import styles from './ProgressBar.module.css';

export type ProgressTone = 'accent' | 'success' | 'warning' | 'danger';

export interface ProgressBarProps {
  value: number;
  tone?: ProgressTone;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, tone = 'accent', label, className }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div
      className={clsx(styles.track, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
    >
      <div className={clsx(styles.fill, styles[tone])} style={{ width: `${percent}%` }} />
    </div>
  );
}
