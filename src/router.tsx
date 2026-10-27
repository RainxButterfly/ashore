/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/router.tsx
 * @描述    路由表：今日、考点、错题、复习、复盘与设置，复盘和设置按需加载。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { lazy, Suspense } from 'react';
import { createHashRouter } from 'react-router-dom';
import { AppShell } from './features/shell/AppShell';
import { NotFoundPage } from './features/shared/NotFoundPage';
import { RouteErrorPage } from './features/shared/RouteErrorPage';
import MistakesPage from './features/mistakes/MistakesPage';
import ReviewPage from './features/review/ReviewPage';
import SyllabusPage from './features/syllabus/SyllabusPage';
import TodayPage from './features/today/TodayPage';
import { PageSkeleton } from './ui/Skeleton';

const InsightsPage = lazy(() => import('./features/insights/InsightsPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

function LazyFallback() {
  return <PageSkeleton />;
}

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <TodayPage />,
      },
      {
        path: 'syllabus',
        element: <SyllabusPage />,
      },
      {
        path: 'mistakes',
        element: <MistakesPage />,
      },
      {
        path: 'review',
        element: <ReviewPage />,
      },
      {
        path: 'insights',
        element: (
          <Suspense fallback={<LazyFallback />}>
            <InsightsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LazyFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
