/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    scripts/check-headers.mjs
 * @描述    检查源码文件头是否包含版权、许可证、文件说明、作者、邮箱与日期。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const extensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.html',
  '.yml',
  '.yaml',
]);
const ignoredDirectories = new Set([
  'node_modules',
  'dist',
  'dev-dist',
  'coverage',
  'playwright-report',
  'test-results',
  '.git',
  '.changeset',
  'docs',
  'public',
]);
const ignoredFiles = new Set([
  normalize('.github/ISSUE_TEMPLATE/bug_report.yml'),
  normalize('.github/ISSUE_TEMPLATE/feature_request.yml'),
  normalize('.github/ISSUE_TEMPLATE/config.yml'),
]);
const requiredTokens = [
  'SPDX-License-Identifier: Apache-2.0',
  '@文件',
  '@描述',
  '@作者',
  '@邮箱',
  '@日期',
  '星河一叶Roxy',
  'ck_xuv@vip.qq.com',
];
const staged = process.argv.includes('--staged');

function normalize(filePath) {
  return filePath.split(path.sep).join('/');
}

function walk(directory) {
  const files = [];

  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    const relativePath = normalize(path.relative(root, absolutePath));

    if (statSync(absolutePath).isDirectory()) {
      if (!ignoredDirectories.has(entry)) {
        files.push(...walk(absolutePath));
      }
      continue;
    }

    if (extensions.has(path.extname(entry)) && !ignoredFiles.has(relativePath)) {
      files.push(relativePath);
    }
  }

  return files;
}

function stagedFiles() {
  try {
    const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
      encoding: 'utf8',
    });

    return output
      .split('\n')
      .map((file) => file.trim())
      .filter(Boolean)
      .filter((file) => extensions.has(path.extname(file)))
      .filter((file) => !ignoredFiles.has(normalize(file)));
  } catch {
    return [];
  }
}

const files = staged ? stagedFiles() : walk(root);
const missing = [];

for (const file of files) {
  let content;
  try {
    content = readFileSync(path.join(root, file), 'utf8');
  } catch {
    missing.push(`${file}（无法读取）`);
    continue;
  }

  const header = content.split(/\r?\n/).slice(0, 45).join('\n');
  const missingTokens = requiredTokens.filter((token) => !header.includes(token));

  if (missingTokens.length > 0) {
    missing.push(`${file}（缺少：${missingTokens.join('、')}）`);
  }
}

if (missing.length > 0) {
  console.error('文件头检查未通过：');
  missing.forEach((file) => console.error(`  - ${file}`));
  console.error('\n请为每个源码文件补充标准文件头，参考 docs/conventions.md。');
  process.exit(1);
}

console.log(`文件头检查通过（${files.length} 个文件）。`);
