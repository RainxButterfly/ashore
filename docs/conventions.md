# 工程约定

这份文档定义 Ashore 的代码风格、文件头、提交规范和验收门槛。新增文件前先读一遍，能让 Review 少一轮往返。

## 文件头

每个源码文件都需要一段可被机器检查的文件头，包含：版权、SPDX 许可证、文件说明、作者、邮箱和创建日期。文件头检查脚本会验证以下 token：

- `SPDX-License-Identifier: Apache-2.0`
- `@文件`
- `@描述`
- `@作者`
- `@邮箱`
- `@日期`
- `星河一叶Roxy`
- `ck_xuv@vip.qq.com`

### TypeScript / JavaScript / CSS

```ts
/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/scheduler.ts
 * @描述    轻量间隔重复调度：根据评分计算下次复习时间。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
```

CSS 使用 `/* ... */`，内容相同。

### HTML

```html
<!doctype html>
<!--
  版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
  SPDX-License-Identifier: Apache-2.0

  @文件    index.html
  @描述    应用入口：挂载根节点并声明 PWA 元信息。
  @作者    星河一叶Roxy
  @邮箱    ck_xuv@vip.qq.com
  @日期    2026-10-27
-->
```

### YAML

```yaml
# 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
# SPDX-License-Identifier: Apache-2.0
#
# @文件    .github/workflows/ci.yml
# @描述    持续集成流程。
# @作者    星河一叶Roxy
# @邮箱    ck_xuv@vip.qq.com
# @日期    2026-10-27
```

### Markdown

文档不参与文件头强制检查。需要署名时，在文末写：

```text
维护者：星河一叶Roxy · ck_xuv@vip.qq.com
```

### 例外

以下文件没有注释语法或不适合写头注释，不参与检查：

- `package.json`、`tsconfig.json`、`.prettierrc.json`、`.changeset/config.json`
- `package-lock.json`
- 构建生成的 `dist/`、`dev-dist/`、`public/icons/`
- `.github/ISSUE_TEMPLATE/*.yml`（YAML frontmatter 必须位于首行）
- `LICENSE`、`NOTICE` 与 Markdown 文档

不要为了“统一”把注释塞进 JSON，那会破坏工具链。例外清单记录在这里，作为团队约定。

## 命名

- 组件使用 PascalCase，函数与变量使用 camelCase。
- Hook 以 `use` 开头，文件名与 Hook 同名。
- 领域逻辑使用产品词汇：`exam`、`node`、`mistake`、`reviewItem`、`readiness`。
- 测试文件与被测文件同目录，命名为 `*.test.ts`。
- 样式使用 CSS Modules；颜色、间距、圆角、阴影必须引用 `src/styles/tokens.css` 中的变量，不写散落色值。

## 分层

```text
core <- data <- hooks <- features
core <- ui <- features
```

- `src/core` 只允许纯 TypeScript，不引入 React、Dexie、DOM。
- `src/data` 负责 Dexie 查询与事务，不负责展示。
- `src/ui` 只放可复用组件，不放业务状态。
- `src/features` 组织页面和业务交互。
- 页面不直接拼 SQL/IndexedDB 查询，统一走 `src/data/repo.ts`。

## 提交

使用 Conventional Commits：

```text
feat(review): add keyboard rating
fix(syllabus): keep children when deleting a parent
docs(adr): explain local-first storage
chore(deps): update vite
```

常用 type：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`。

贡献使用 DCO：

```bash
git commit -s -m "fix(import): reject cyclic parents"
```

## 分支与 PR

- 从 `main` 创建短分支：`feat/...`、`fix/...`、`docs/...`。
- 一个 PR 只做一件事；不要把重构、依赖升级和功能混在一起。
- PR 描述写清楚问题、方案、取舍和验证方式。
- 界面改动附桌面与移动端截图。
- 数据结构改动必须同步迁移与文档。

## 测试与验收

提交前：

```bash
npm run check
npm run test:e2e
```

`npm run check` 会依次执行文件头、ESLint、Prettier、类型检查、单元测试、生产构建和包体预算。

涉及界面时，至少在以下视口检查：

- 桌面 `1440×900`
- 移动端 `390×844`
- 深色模式
- `prefers-reduced-motion: reduce`

## 包体

当前预算：

- 首屏 JS ≤ 180 KB gzip
- 全部 JS ≤ 260 KB gzip
- 首屏 CSS ≤ 40 KB gzip
- 全部 CSS ≤ 60 KB gzip

新增依赖前先评估体积与替代方案。不要引入完整图标库、图表库、中文 Web 字体或重型 UI 框架。

## 安全与隐私

- 不提交 `.env`、密钥、导出备份或真实复习数据。
- 用户输入按纯文本渲染；如后续支持 Markdown，必须做白名单清洗。
- 导入 JSON 需要校验 `app`、`schemaVersion` 与数据表结构，不能直接信任外部文件。
- 不在界面展示堆栈、WebView 版本等内部诊断信息；技术细节写入控制台或开发者日志。

维护者：星河一叶Roxy · ck_xuv@vip.qq.com
