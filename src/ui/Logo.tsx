/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/Logo.tsx
 * @描述    品牌标记：以日、浪与星构成“上岸”的视觉符号。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="48" height="48" rx="14" fill="var(--accent-strong)" />
      <circle cx="23" cy="19" r="8" fill="var(--accent-contrast)" opacity="0.94" />
      <path
        d="M8 30c4.2 0 4.2 2.6 8.4 2.6s4.2-2.6 8.4-2.6 4.2 2.6 8.4 2.6S37.4 30 40 30"
        stroke="var(--accent-contrast)"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.92"
      />
      <path
        d="M10 36c3.5 0 3.5 2.2 7 2.2s3.5-2.2 7-2.2 3.5 2.2 7 2.2 3.5-2.2 6-2.2"
        stroke="var(--accent-contrast)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="m36 8 1.3 3.4L40.7 12l-3.4 1.3L36 16.7l-1.3-3.4L31.3 12l3.4-1.3z"
        fill="var(--accent-contrast)"
        opacity="0.9"
      />
    </svg>
  );
}
