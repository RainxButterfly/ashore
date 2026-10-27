/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/shell/AppShell.tsx
 * @描述    应用外壳：桌面侧栏与移动端底栏共享同一套导航和考试上下文。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import clsx from 'clsx';
import { useEffect } from 'react';
import type { ComponentType } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { APP_LICENSE, APP_NAME, APP_VERSION } from '../../constants';
import { useActiveExam, useDueCards } from '../../hooks/useExamQueries';
import { IconButton } from '../../ui/Button';
import {
  ChartIcon,
  HomeIcon,
  LayersIcon,
  NotebookIcon,
  RepeatIcon,
  SettingsIcon,
  ShieldIcon,
  type IconProps,
} from '../../ui/icons';
import { BrandMark } from '../../ui/Logo';
import { ToastHost } from '../../ui/ToastHost';
import { ExamSwitcher } from './ExamSwitcher';
import styles from './AppShell.module.css';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<IconProps>;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '今日', icon: HomeIcon, end: true },
  { to: '/syllabus', label: '考点', icon: LayersIcon },
  { to: '/mistakes', label: '错题', icon: NotebookIcon },
  { to: '/review', label: '复习', icon: RepeatIcon },
  { to: '/insights', label: '复盘', icon: ChartIcon },
];

const PAGE_TITLES: Record<string, string> = {
  '/': '今日',
  '/syllabus': '考点',
  '/mistakes': '错题',
  '/review': '复习',
  '/insights': '复盘',
  '/settings': '设置',
};

function DueBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return <span className={styles.navBadge}>{count > 99 ? '99+' : count}</span>;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { exam, exams } = useActiveExam();
  const dueCards = useDueCards(exam?.id ?? null);
  const dueCount = dueCards?.length ?? 0;
  const pageTitle = PAGE_TITLES[location.pathname] ?? '今日';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className={styles.shell}>
      <button
        type="button"
        className={styles.skipLink}
        onClick={() => document.getElementById('main')?.focus()}
      >
        跳到主要内容
      </button>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <BrandMark size={36} />
          <div className={styles.brandCopy}>
            <span className={styles.brandName}>{APP_NAME}</span>
            <span className={styles.brandCn}>上岸</span>
          </div>
        </div>

        {exams.length > 0 ? (
          <ExamSwitcher exams={exams} activeExamId={exam?.id ?? null} />
        ) : (
          <NavLink to="/settings" className={styles.createExam}>
            创建第一场考试
          </NavLink>
        )}

        <nav className={styles.nav} aria-label="主导航">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.to === '/review' ? <DueBadge count={dueCount} /> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <ThemeToggle />
          <NavLink
            to="/settings"
            className={({ isActive }) => clsx(styles.footLink, isActive && styles.footLinkActive)}
          >
            <SettingsIcon size={17} />
            <span>设置</span>
            <span className={styles.footVersion}>v{APP_VERSION}</span>
          </NavLink>
          <div className={styles.localNote}>
            <ShieldIcon size={14} />
            <span>数据只保存在这台设备</span>
          </div>
          <span className={styles.license}>{APP_LICENSE}</span>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.mobileBar}>
          <div className={styles.mobileTitle}>
            {location.pathname === '/' ? (
              <>
                <BrandMark size={27} />
                <span>{APP_NAME}</span>
              </>
            ) : (
              <span>{pageTitle}</span>
            )}
          </div>
          <div className={styles.mobileActions}>
            <ThemeToggle compact />
            <IconButton
              label="打开设置"
              icon={<SettingsIcon size={19} />}
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
            />
          </div>
        </header>

        <main id="main" className={styles.main} tabIndex={-1}>
          <Outlet />
        </main>

        <nav className={styles.bottomNav} aria-label="底部导航">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(styles.bottomItem, isActive && styles.bottomItemActive)
                }
              >
                <span className={styles.bottomIcon}>
                  <Icon size={21} />
                  {item.to === '/review' && dueCount > 0 ? (
                    <span className={styles.bottomBadge}>{dueCount > 9 ? '9+' : dueCount}</span>
                  ) : null}
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <ToastHost />
    </div>
  );
}
