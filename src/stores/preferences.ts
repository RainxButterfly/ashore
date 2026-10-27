/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/stores/preferences.ts
 * @描述    用户偏好：主题与当前考试，写入 IndexedDB 并缓存主题避免首屏闪烁。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { create } from 'zustand';
import type { ThemeMode } from '../core/types';
import { getSetting, setSetting, SETTING_KEYS } from '../data/repo';

const THEME_CACHE_KEY = 'ashore-theme';

function readCachedTheme(): ThemeMode {
  try {
    const cached = window.localStorage.getItem(THEME_CACHE_KEY);
    if (cached === 'light' || cached === 'dark' || cached === 'system') {
      return cached;
    }
  } catch {
    // 隐私模式下 localStorage 可能不可用，回退到跟随系统即可。
  }
  return 'system';
}

interface PreferencesState {
  theme: ThemeMode;
  activeExamId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setActiveExamId: (examId: string | null) => Promise<void>;
}

export const usePreferences = create<PreferencesState>((set, get) => ({
  theme: readCachedTheme(),
  activeExamId: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    try {
      const [theme, activeExamId] = await Promise.all([
        getSetting<ThemeMode>(SETTING_KEYS.theme, 'system'),
        getSetting<string | null>(SETTING_KEYS.activeExamId, null),
      ]);

      set({ theme, activeExamId, hydrated: true });

      try {
        window.localStorage.setItem(THEME_CACHE_KEY, theme);
      } catch {
        // 缓存失败只影响首屏主题，不影响数据本身。
      }
    } catch (error) {
      console.error('读取本地偏好失败', error);
      set({ hydrated: true });
    }
  },

  setTheme: async (theme) => {
    set({ theme });

    try {
      window.localStorage.setItem(THEME_CACHE_KEY, theme);
    } catch {
      // 缓存失败不影响当前主题。
    }

    try {
      await setSetting(SETTING_KEYS.theme, theme);
    } catch (error) {
      console.error('保存主题失败', error);
    }
  },

  setActiveExamId: async (examId) => {
    set({ activeExamId: examId });

    try {
      await setSetting(SETTING_KEYS.activeExamId, examId);
    } catch (error) {
      console.error('保存当前考试失败', error);
    }
  },
}));
