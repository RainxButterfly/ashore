/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    e2e/app.spec.ts
 * @描述    核心流程回归：载入示例、记录错题、进入复习并完成一次评分。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { expect, test, type Page } from '@playwright/test';

async function seedIfNeeded(page: Page) {
  const seedButton = page.getByRole('button', { name: '载入示例数据' });
  await seedButton.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});

  if (await seedButton.isVisible().catch(() => false)) {
    await seedButton.click();
    await expect(page.getByText('考点覆盖', { exact: true })).toBeVisible();
  }
}

test('sample data → capture mistake → review once', async ({ page }) => {
  await page.goto('/');
  await seedIfNeeded(page);

  await expect(page.getByText('上岸指数', { exact: true }).first()).toBeVisible();

  await page.locator('nav[aria-label="主导航"]').getByRole('link', { name: '错题' }).click();
  await expect(page.getByRole('heading', { name: '错题本', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '记错题' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('题目内容')).toBeFocused();
  await page.getByLabel('题目内容').fill('E2E 测试错题：1 + 1 等于几？');
  await page.getByLabel('正确答案 / 正确思路').fill('2');
  await page.getByRole('button', { name: '收进错题本' }).click();

  await expect(page.getByText('E2E 测试错题：1 + 1 等于几？')).toBeVisible();

  await page.locator('nav[aria-label="主导航"]').getByRole('link', { name: '复习' }).click();
  await expect(page.getByRole('button', { name: '显示答案' })).toBeVisible();
  await page.getByRole('button', { name: '显示答案' }).click();
  await page.getByRole('button', { name: /记得/ }).click();

  await expect(
    page.getByText('本轮复习完成').or(page.getByRole('button', { name: '显示答案' })),
  ).toBeVisible();
});

test('supports keyboard review shortcuts', async ({ page }) => {
  await page.goto('/');
  await seedIfNeeded(page);

  await page.locator('nav[aria-label="主导航"]').getByRole('link', { name: '复习' }).click();
  await expect(page.getByRole('button', { name: '显示答案' })).toBeVisible();

  await page.keyboard.press('Space');
  await expect(page.getByRole('group', { name: '选择回忆程度' })).toBeVisible();
  await page.keyboard.press('3');

  await expect(
    page.getByText('本轮复习完成').or(page.getByRole('button', { name: '显示答案' })),
  ).toBeVisible();
});

test('adds a syllabus node from the dialog', async ({ page }) => {
  await page.goto('/');
  await seedIfNeeded(page);

  await page.locator('nav[aria-label="主导航"]').getByRole('link', { name: '考点' }).click();
  await expect(page.getByRole('heading', { name: '考点', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '添加考点' }).first().click();
  await expect(page.getByLabel('考点名称')).toBeFocused();
  await page.getByLabel('考点名称').fill('UI 测试考点');
  await page.getByRole('dialog').getByRole('button', { name: '添加考点' }).click();

  await expect(page.getByRole('button', { name: /^UI 测试考点/ })).toBeVisible();
});

test('skip link focuses main without changing the route', async ({ page }) => {
  await page.goto('/');
  await seedIfNeeded(page);

  const skipLink = page.getByRole('button', { name: '跳到主要内容' });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');

  const state = await page.evaluate(() => ({
    hash: window.location.hash,
    activeId: document.activeElement?.id,
  }));

  expect(state.activeId).toBe('main');
  expect(state.hash).not.toContain('main');
});

test('imports an outline hierarchy', async ({ page }) => {
  await page.goto('/');
  await seedIfNeeded(page);

  await page.locator('nav[aria-label="主导航"]').getByRole('link', { name: '考点' }).click();
  await expect(page.getByRole('heading', { name: '考点', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '导入大纲' }).first().click();
  await page.getByRole('textbox', { name: '大纲文本' }).fill('测试科目A | 5\n  测试子项B | 4');
  await page.getByRole('button', { name: '导入', exact: true }).click();

  await expect(page.getByText('测试科目A')).toBeVisible();
  await expect(page.getByText('测试子项B')).toBeVisible();
});
