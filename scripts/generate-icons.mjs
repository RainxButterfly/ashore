/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    scripts/generate-icons.mjs
 * @描述    从矢量图标生成 PWA 与 iOS 所需的 PNG 尺寸。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const iconsDir = 'public/icons';

await mkdir(iconsDir, { recursive: true });

await Promise.all([
  sharp('public/icon.svg').resize(192, 192).png().toFile(`${iconsDir}/icon-192.png`),
  sharp('public/icon.svg').resize(512, 512).png().toFile(`${iconsDir}/icon-512.png`),
  sharp('public/icon-maskable.svg')
    .resize(512, 512)
    .png()
    .toFile(`${iconsDir}/icon-maskable-512.png`),
  sharp('public/icon-maskable.svg').resize(180, 180).png().toFile('public/apple-touch-icon.png'),
]);

console.log('PWA 图标已生成：192 / 512 / maskable 512 / apple-touch 180');
