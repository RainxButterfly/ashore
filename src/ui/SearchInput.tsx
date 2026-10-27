/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/SearchInput.tsx
 * @描述    搜索输入框：左侧放大镜图标，移动端占满可用宽度。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import clsx from 'clsx';
import { SearchIcon } from './icons';
import { Input, type InputProps } from './Form';
import styles from './SearchInput.module.css';

export interface SearchInputProps extends InputProps {
  wrapperClassName?: string;
}

export function SearchInput({ wrapperClassName, className, ...rest }: SearchInputProps) {
  return (
    <div className={clsx(styles.wrapper, wrapperClassName)}>
      <SearchIcon size={17} className={styles.icon} />
      <Input type="search" className={clsx(styles.input, className)} {...rest} />
    </div>
  );
}
