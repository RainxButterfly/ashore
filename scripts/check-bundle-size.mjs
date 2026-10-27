/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    scripts/check-bundle-size.mjs
 * @描述    检查生产构建的首屏与总包体预算，防止无意引入重型依赖。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const distDir = path.join(process.cwd(), 'dist');
const manifestPath = path.join(distDir, '.vite', 'manifest.json');

if (!existsSync(manifestPath)) {
  console.error('找不到 dist/.vite/manifest.json，请先运行 npm run build。');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);

if (!entryKey) {
  console.error('构建清单中没有入口文件。');
  process.exit(1);
}

function gzipSize(relativeFile) {
  const absolutePath = path.join(distDir, relativeFile);
  if (!existsSync(absolutePath)) {
    return 0;
  }
  return gzipSync(readFileSync(absolutePath)).length;
}

function collectStaticChunks(key, seen = new Set()) {
  if (seen.has(key)) {
    return seen;
  }
  seen.add(key);
  const chunk = manifest[key];
  if (!chunk) {
    return seen;
  }
  for (const imported of chunk.imports ?? []) {
    collectStaticChunks(imported, seen);
  }
  return seen;
}

function collectCss(key, seen = new Set()) {
  if (seen.has(key)) {
    return seen;
  }
  seen.add(key);
  const chunk = manifest[key];
  if (!chunk) {
    return seen;
  }
  for (const imported of chunk.imports ?? []) {
    collectCss(imported, seen);
  }
  return seen;
}

const initialKeys = [...collectStaticChunks(entryKey)];
const initialJs = initialKeys.reduce((sum, key) => sum + gzipSize(manifest[key].file), 0);
const cssKeys = [...collectCss(entryKey)];
const initialCss = cssKeys.reduce((sum, key) => {
  const chunk = manifest[key];
  return sum + (chunk.css ?? []).reduce((cssSum, file) => cssSum + gzipSize(file), 0);
}, 0);

const assetDir = path.join(distDir, 'assets');
const totalJs = readdirSync(assetDir)
  .filter((file) => file.endsWith('.js'))
  .reduce((sum, file) => sum + gzipSize(path.posix.join('assets', file)), 0);
const totalCss = readdirSync(assetDir)
  .filter((file) => file.endsWith('.css'))
  .reduce((sum, file) => sum + gzipSize(path.posix.join('assets', file)), 0);

const budgets = {
  initialJs: 180 * 1024,
  totalJs: 260 * 1024,
  initialCss: 40 * 1024,
  totalCss: 60 * 1024,
};

const results = [
  ['首屏 JS', initialJs, budgets.initialJs],
  ['全部 JS', totalJs, budgets.totalJs],
  ['首屏 CSS', initialCss, budgets.initialCss],
  ['全部 CSS', totalCss, budgets.totalCss],
];

let failed = false;

for (const [label, size, budget] of results) {
  const kb = (size / 1024).toFixed(1);
  const budgetKb = (budget / 1024).toFixed(0);
  const ok = size <= budget;
  if (!ok) {
    failed = true;
  }
  console.log(`${ok ? '✓' : '✗'} ${label}: ${kb} KB gzip / 预算 ${budgetKb} KB`);
}

if (failed) {
  console.error('包体超出预算，请检查依赖或拆分方案。');
  process.exit(1);
}
