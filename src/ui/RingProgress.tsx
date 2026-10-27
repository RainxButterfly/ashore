/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/RingProgress.tsx
 * @描述    环形进度：展示上岸指数，中心显示百分比与指标名。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import styles from './RingProgress.module.css';

export interface RingProgressProps {
  value: number;
  label?: string;
  size?: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RingProgress({ value, label = '上岸指数', size = 148 }: RingProgressProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const percent = Math.round(clamped * 100);
  const offset = CIRCUMFERENCE * (1 - clamped);

  return (
    <div
      className={styles.ring}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label} ${percent}%`}
    >
      <svg className={styles.svg} viewBox="0 0 120 120" aria-hidden="true">
        <circle className={styles.track} cx="60" cy="60" r={RADIUS} />
        <circle
          className={styles.fill}
          cx="60"
          cy="60"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.center} aria-hidden="true">
        <span className={styles.value}>
          {percent}
          <small>%</small>
        </span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
