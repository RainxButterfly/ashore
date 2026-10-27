/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/App.tsx
 * @描述    应用根组件：恢复本地偏好、应用主题并挂载路由与错误边界。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { router } from './router';
import { usePreferences } from './stores/preferences';
import { AppErrorBoundary } from './ui/AppErrorBoundary';

export default function App() {
  const hydrate = usePreferences((state) => state.hydrate);
  useTheme();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    // 尽量降低浏览器在空间紧张时回收本地数据的概率。
    void navigator.storage?.persist?.().catch(() => undefined);
  }, []);

  return (
    <AppErrorBoundary>
      <RouterProvider router={router} />
    </AppErrorBoundary>
  );
}
