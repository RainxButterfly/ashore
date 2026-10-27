/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/shared/RouteErrorPage.tsx
 * @描述    路由错误页：加载失败时给出友好说明，技术错误只写入控制台。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { BrandMark } from '../../ui/Logo';
import styles from './RouteErrorPage.module.css';

export function RouteErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    console.error('路由加载失败', error);
  }, [error]);

  const goHome = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <BrandMark size={44} />
        <h1 className={styles.title}>页面加载失败</h1>
        <p className={styles.description}>
          你的数据仍然保存在本机。刷新页面或回到今日继续，不会丢失任何记录。
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
          <Button variant="secondary" onClick={goHome}>
            回到今日
          </Button>
        </div>
      </div>
    </div>
  );
}
