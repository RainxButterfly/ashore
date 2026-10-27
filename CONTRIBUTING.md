# 贡献指南

感谢你愿意参与 Ashore。这个项目希望保持三件事：数据属于用户、逻辑可以解释、代码可以长期维护。

## 开发环境

- Node.js `>= 22.12`
- npm（仓库使用 `package-lock.json`）
- 推荐使用最新版 Chrome 或 Edge 验收 PWA 与移动端布局

```bash
npm install
npm run dev
```

## 分支与提交

- 从 `main` 创建短生命周期分支：`feat/review-shortcut`、`fix/import-cycle`。
- 提交信息遵循 Conventional Commits：
  - `feat(review): add keyboard rating`
  - `fix(syllabus): keep children when deleting a parent`
  - `docs: explain backup format`
- 使用 DCO 声明你有权提交该代码：

```bash
git commit -s -m "feat(review): add keyboard rating"
```

本项目不要求 CLA。

## 文件头

每个源码文件必须包含标准文件头，包括版权、SPDX 许可证、文件说明、作者、邮箱和创建日期。模板见 [docs/conventions.md](docs/conventions.md)。

提交前会由 Husky 执行暂存区文件头检查；也可以手动运行：

```bash
npm run check:headers
```

## 代码约定

- 使用 TypeScript 严格模式；领域逻辑放在 `src/core`，不要引入 React。
- 业务数据访问集中在 `src/data/repo.ts`，使用事务保证评分、日志和掌握度同步更新。
- UI 使用 CSS Modules 与 `src/styles/tokens.css` 中的设计令牌，不引入重型组件库。
- 用户可见文案使用中文；错误提示要说明下一步怎么做，不展示堆栈或内部版本信息。
- 图片、字体与图标优先本地资源；不提交密钥、备份文件或个人复习数据。

## 测试

```bash
npm run test:run       # 单元与数据层测试
npm run test:e2e       # Playwright 核心流程
npm run check          # 文件头、Lint、格式、类型、单测、构建、包体
```

Windows 本地默认复用系统 Edge 运行 E2E；macOS / Linux 首次运行前执行：

```bash
npx playwright install chromium
```

新增或修改以下逻辑时，请补充测试：

- `src/core/scheduler.ts` 的间隔计算；
- `src/core/readiness.ts` 的上岸指数与掌握度；
- `src/core/outline.ts` 的大纲与 CSV 解析；
- `src/data/repo.ts` 的事务与导入导出。

## UI 验收

涉及界面的改动至少检查：

- 桌面 `1440×900`：侧栏、内容宽度、键盘焦点；
- 移动端 `390×844`：底部导航、安全区、对话框底部抽屉、按钮不换行截断；
- 深色模式与 `prefers-reduced-motion`；
- 空状态、加载状态和错误状态。

## 数据结构变更

修改 `Exam`、`SyllabusNode`、`Mistake`、`ReviewItem` 或 `ReviewLog` 时：

1. 在 `src/data/db.ts` 增加 Dexie 版本与迁移；
2. 更新 `docs/data-model.md`；
3. 确认 JSON 备份仍可导入，或提升 `schemaVersion` 并提供迁移说明；
4. 补一条 ADR（如果这是一个不可逆的取舍）。

## 包体预算

`npm run build` 后执行 `npm run check:bundle`。当前预算：

- 首屏 JS ≤ 180 KB gzip
- 全部 JS ≤ 260 KB gzip
- 首屏 CSS ≤ 40 KB gzip
- 全部 CSS ≤ 60 KB gzip

引入新依赖前，请先说明它解决的问题、替代方案和对包体的影响。

## Pull Request

- 描述问题、方案和取舍，而不只是“改了哪些文件”；
- 关联 Issue；
- 附上桌面与移动端截图（界面改动）；
- 确认 `npm run check` 与 `npm run test:e2e` 通过；
- 保持 PR 聚焦，不混入无关重构。

## 联系方式

维护者：星河一叶Roxy · [ck_xuv@vip.qq.com](mailto:ck_xuv@vip.qq.com)
