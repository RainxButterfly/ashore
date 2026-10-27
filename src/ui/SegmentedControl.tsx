/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/SegmentedControl.tsx
 * @描述    分段选择器：基于原生单选框，支持图标、键盘与焦点可见。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import clsx from 'clsx';
import { useId } from 'react';
import type { ReactNode } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <div className={clsx(styles.group, className)} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            className="sr-only"
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span className={styles.surface}>
            {option.icon}
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
