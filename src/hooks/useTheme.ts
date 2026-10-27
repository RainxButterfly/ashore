/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/hooks/useTheme.ts
 * @描述    应用主题：解析跟随系统偏好，同步根节点、系统控件和浏览器状态栏颜色。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useEffect } from 'react';
import { usePreferences } from '../stores/preferences';

const THEME_COLOR = {
  light: '#F6F4EE',
  dark: '#121513',
} as const;

export function useTheme(): void {
  const theme = usePreferences((state) => state.theme);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      const root = document.documentElement;

      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;

      document
        .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        .forEach((meta) => meta.setAttribute('content', THEME_COLOR[resolved]));
    };

    apply();

    if (theme !== 'system') {
      return;
    }

    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
