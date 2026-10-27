/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    scripts/capture-screenshots.mjs
 * @描述    用系统 Edge/Chrome 截取桌面与移动端页面，供 README 和视觉验收使用。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

/* global document -- 该回调在浏览器页面上下文中执行 */

const baseUrl = process.env.ASHORE_URL ?? 'http://127.0.0.1:5173';
const outputDir = path.resolve('docs/screenshots');

await mkdir(outputDir, { recursive: true });

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'msedge' });
  } catch {
    try {
      return await chromium.launch({ channel: 'chrome' });
    } catch {
      return await chromium.launch();
    }
  }
}

const browser = await launchBrowser();
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  locale: 'zh-CN',
  colorScheme: 'light',
});
const page = await context.newPage();
const errors = [];

page.on('pageerror', (error) => {
  errors.push(`pageerror: ${error.message}`);
});
page.on('console', (message) => {
  if (message.type() === 'error') {
    errors.push(`console: ${message.text()}`);
  }
});

async function settle() {
  await page.waitForTimeout(450);
  await page.evaluate(() => document.fonts.ready);
}

async function capture(name, fullPage = true) {
  await settle();
  await page.screenshot({ path: path.join(outputDir, name), fullPage });
  console.log(`saved ${name}`);
}

await page.goto(baseUrl, { waitUntil: 'networkidle' });

const seedButton = page.getByRole('button', { name: '载入示例数据' });
if (await seedButton.isVisible().catch(() => false)) {
  await seedButton.click();
  await page.getByText('上岸指数', { exact: true }).first().waitFor({ timeout: 10_000 });
  await page.waitForTimeout(3600);
}

await capture('today-desktop.png');

await page.goto(`${baseUrl}/#/syllabus`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: '考点', exact: true }).first().waitFor();
await capture('syllabus-desktop.png');

await page.goto(`${baseUrl}/#/mistakes`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: '错题本', exact: true }).first().waitFor();
await capture('mistakes-desktop.png');

await page.goto(`${baseUrl}/#/review`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '显示答案' }).waitFor({ timeout: 10_000 });
await capture('review-front-desktop.png');
await page.getByRole('button', { name: '显示答案' }).click();
await page.getByRole('group', { name: '选择回忆程度' }).waitFor();
await capture('review-answer-desktop.png');

await page.goto(`${baseUrl}/#/insights`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: '复盘', exact: true }).first().waitFor();
await capture('insights-desktop.png');

await page.goto(`${baseUrl}/#/settings`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: '设置', exact: true }).first().waitFor();
await capture('settings-desktop.png');

await page.emulateMedia({ colorScheme: 'dark' });
await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
await page.getByText('上岸指数', { exact: true }).first().waitFor();
await capture('today-dark-desktop.png');
await page.emulateMedia({ colorScheme: 'light' });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
await page.getByText('上岸指数', { exact: true }).first().waitFor();
await capture('today-mobile.png', false);

await page.goto(`${baseUrl}/#/syllabus`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: '考点', exact: true }).first().waitFor();
await capture('syllabus-mobile.png', false);

await page.goto(`${baseUrl}/#/review`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '显示答案' }).waitFor();
await capture('review-mobile.png', false);

console.log('console errors:', errors.length > 0 ? JSON.stringify(errors, null, 2) : 'none');

await browser.close();
