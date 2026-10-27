/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/shell/ThemeToggle.tsx
 * @描述    主题切换按钮：在跟随系统、浅色和深色之间循环。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import clsx from 'clsx';
import type { ThemeMode } from '../../core/types';
import { usePreferences } from '../../stores/preferences';
import { MonitorIcon, MoonIcon, SunIcon } from '../../ui/icons';
import styles from './ThemeToggle.module.css';

const THEME_ORDER: ThemeMode[] = ['system', 'light', 'dark'];
const THEME_LABELS: Record<ThemeMode, string> = {
  system: '跟随系统',
  light: '浅色',
  dark: '深色',
};

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const currentIndex = THEME_ORDER.indexOf(theme);
  const nextTheme = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length] ?? 'system';
  const Icon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon;
  const label = THEME_LABELS[theme];

  return (
    <button
      type="button"
      className={clsx(styles.toggle, compact && styles.compact)}
      onClick={() => void setTheme(nextTheme)}
      aria-label={`主题：${label}，点击切换`}
      title={`主题：${label}`}
    >
      <Icon size={compact ? 18 : 16} />
      <span className={compact ? 'sr-only' : styles.label}>{label}</span>
    </button>
  );
}
