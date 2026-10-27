/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/toast.ts
 * @描述    轻量提示状态：最多保留三条，成功/错误/普通三种语气。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { create } from 'zustand';
import { createId } from '../core/id';

export type ToastTone = 'default' | 'success' | 'danger';

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastStore {
  items: ToastItem[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (message, tone = 'default') => {
    const item: ToastItem = { id: createId(), message, tone };
    set((state) => ({ items: [...state.items, item].slice(-3) }));
  },
  dismiss: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
}));

export const toast = {
  info: (message: string) => useToastStore.getState().push(message, 'default'),
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'danger'),
};
