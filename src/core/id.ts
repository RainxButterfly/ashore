/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/id.ts
 * @描述    生成稳定可移植的本地唯一标识，优先使用浏览器安全随机 UUID。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `ashore-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
