/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/ToastHost.tsx
 * @描述    提示浮层：自动消失、屏幕阅读器播报并避开移动端底部导航。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangleIcon, CheckCircleIcon, StarIcon } from './icons';
import styles from './ToastHost.module.css';
import { useToastStore, type ToastItem } from './toast';

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), item.tone === 'danger' ? 4600 : 3200);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.id, item.tone]);

  const Icon =
    item.tone === 'success'
      ? CheckCircleIcon
      : item.tone === 'danger'
        ? AlertTriangleIcon
        : StarIcon;

  return (
    <div
      className={`${styles.toast} ${styles[item.tone]}`}
      role={item.tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon size={17} />
      <span>{item.message}</span>
    </div>
  );
}

export function ToastHost() {
  const items = useToastStore((state) => state.items);

  if (typeof document === 'undefined' || items.length === 0) {
    return null;
  }

  return createPortal(
    <div className={styles.viewport} aria-live="polite" aria-atomic="false">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  );
}
