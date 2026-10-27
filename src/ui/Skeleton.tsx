/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/Skeleton.tsx
 * @描述    加载占位：在本地查询完成前保持布局稳定，避免内容跳动。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, radius = 6, className }: SkeletonProps) {
  const style: CSSProperties = { width, height, borderRadius: radius };
  return <span className={clsx(styles.skeleton, className)} style={style} aria-hidden="true" />;
}

export function PageSkeleton() {
  return (
    <div className={styles.page}>
      <Skeleton width="38%" height={30} radius={8} />
      <Skeleton width="62%" height={14} />
      <div className={styles.grid}>
        <Skeleton height={220} radius={18} />
        <Skeleton height={220} radius={18} />
      </div>
      <Skeleton height={140} radius={18} />
    </div>
  );
}
