# ADR 0003：v0.1 使用单包分层，暂不拆 monorepo

- 状态：已接受
- 日期：2026-10-27
- 决策者：星河一叶Roxy

## 背景

早期方案设想使用 `apps/web`、`packages/core`、`packages/ui` 的 monorepo。v0.1 只有一个 Web 应用，领域接口仍在快速变化；此时引入 workspace、构建编排和跨包类型配置，会增加大量与产品无关的维护成本。

## 决策

v0.1 使用单包 + 目录分层：

```text
src/core      纯 TypeScript 领域逻辑，不依赖 React / Dexie / DOM
src/data      Dexie 仓库与事务
src/ui        设计系统
src/features  页面与业务交互
```

通过 ESLint 与代码审查保持依赖方向，而不是通过包边界强制。

## 结果

正面：

- 脚本、类型检查、测试和构建配置都更少。
- 重构领域接口时不需要同时改多个 package.json 与导出入口。
- 仍然可以通过“core 不引入 React”保持可测试与可复用。

负面：

- 包边界没有被工具强制执行，依赖方向依赖约定与 Review。
- 如果未来出现第二个应用（Tauri 壳、同步服务），单包会开始显得拥挤。

## 备选方案

- **npm workspaces**：适合多应用，但 v0.1 只有一个应用。
- **Nx / Turborepo**：构建缓存与任务编排强，但对当前规模过重。
- **独立 core 仓库**：版本管理清晰，但会引入跨仓库联动成本。

## 何时重新评估

满足任一条件时，拆分为 workspace：

1. 出现第二个消费 `core` 的应用（例如同步服务或独立 CLI）；
2. `core` 的公开 API 稳定，并需要独立版本号；
3. 单次 CI 时间明显受单包影响。

拆分时优先保持 `@ashore/core` 的纯 TypeScript 特性，并为它建立独立的测试与变更日志。
