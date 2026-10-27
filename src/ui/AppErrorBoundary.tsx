/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/AppErrorBoundary.tsx
 * @描述    渲染错误边界：向用户给出可行动提示，技术细节只写入控制台。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';
import { BrandMark } from './Logo';
import styles from './AppErrorBoundary.module.css';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('页面渲染失败', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <BrandMark size={44} />
          <h1 className={styles.title}>页面出了点问题</h1>
          <p className={styles.description}>
            你的考试、考点和错题仍然保存在本机。刷新页面即可继续，数据不会丢失。
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      </div>
    );
  }
}
