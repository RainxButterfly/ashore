/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/shared/NotFoundPage.tsx
 * @描述    404 页面：保留应用外壳，给出回到今日的明确路径。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { Link } from 'react-router-dom';
import { EmptyState } from '../../ui/EmptyState';
import { LayersIcon } from '../../ui/icons';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <EmptyState
        icon={<LayersIcon size={22} />}
        title="这个页面不存在"
        description="地址可能已经变化，回到今日继续你的复习计划。"
        action={
          <Link to="/" className={styles.link}>
            回到今日
          </Link>
        }
      />
    </div>
  );
}
