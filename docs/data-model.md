# 数据模型

## 实体

| 实体           | 作用               | 关键字段                                                    |
| -------------- | ------------------ | ----------------------------------------------------------- |
| `Exam`         | 一场考试           | `examDate`、`category`、`targetScore`                       |
| `SyllabusNode` | 考点树节点         | `parentId`、`weight`、`mastery`、`order`                    |
| `Mistake`      | 一道错题           | `nodeId`、`content`、`answer`、`analysis`、`tags`、`status` |
| `ReviewItem`   | 错题对应的复习状态 | `dueAt`、`ease`、`intervalDays`、`reps`、`lapses`           |
| `ReviewLog`    | 一次评分记录       | `rating`、`reviewedAt`、`elapsedMs`                         |
| `settings`     | 键值偏好           | `theme`、`activeExamId`、`lastExportAt`                     |

## Dexie 表与索引

```text
exams        id, examDate, createdAt
nodes        id, examId, parentId, [examId+order]
mistakes     id, examId, nodeId, status, createdAt
reviewItems  id, examId, mistakeId, dueAt, [examId+dueAt]
reviewLogs   id, examId, reviewedAt, mistakeId
settings     key
```

## 关系

```text
Exam 1 ── n SyllabusNode
Exam 1 ── n Mistake
Mistake 1 ── 0..1 ReviewItem
Mistake 1 ── n ReviewLog
SyllabusNode 1 ── n Mistake（通过 Mistake.nodeId）
```

## 不变量

1. 每道错题在新创建时生成一条 `ReviewItem`，`dueAt` 为当前时间。
2. 复习评分必须在同一事务中更新 `ReviewItem`、写入 `ReviewLog`，并在存在关联考点时更新 `SyllabusNode.mastery`。
3. `ReviewLog` 是历史记录，删除错题时保留；删除错题只删除对应的 `ReviewItem`。
4. 删除考点时，子考点上移一级，关联错题的 `nodeId` 置空，不删除错题。
5. `ReviewItem.dueAt` 使用 ISO 字符串；到期判断按本地日期结束时间计算。
6. `mastery` 始终在 `0–1`，`weight` 始终在 `1–5`。
7. 同一场考试可以有多条错题，但每道错题只有一条当前复习项。

## 调度状态

`ReviewItem` 同时承载调度所需字段：

- `ease`：难度因子，范围 1.3–2.8。
- `intervalDays`：当前间隔天数；「忘记」后为 0。
- `reps`：连续成功次数；「忘记」后重置为 0。
- `lapses`：遗忘次数。
- `lastReviewedAt`：最近一次评分时间。
- `dueAt`：下一次到期时间。

具体公式见 `src/core/scheduler.ts` 与 [ADR 0002](adr/0002-sm2-scheduler.md)。

## 备份格式

```json
{
  "app": "ashore",
  "schemaVersion": 1,
  "exportedAt": "2026-10-27T12:00:00.000Z",
  "data": {
    "exams": [],
    "nodes": [],
    "mistakes": [],
    "reviewItems": [],
    "reviewLogs": []
  }
}
```

导入时校验：

- `app === "ashore"`；
- `schemaVersion === 1`；
- `data` 中五张表都存在且为数组；
- 文件不超过 20 MB。

当前导入策略是**整体替换**，不保留原有数据。界面会显示考试 / 考点 / 错题 / 复习记录数量，并要求输入「导入」确认。

## 迁移策略

- Dexie 表结构变化：在 `src/data/db.ts` 中递增版本并写迁移函数。
- 备份格式变化：提升 `schemaVersion`，在 `parseImportBundle` 中增加兼容分支或明确拒绝旧版本。
- 迁移必须配单元测试或数据层测试，并更新本文件。
- 不修改已经发布的旧版本迁移定义，只追加新版本。

## 容量与清理

- 错题图片在写入前压缩到最长边 1280px、JPEG 质量 0.82。
- 图片以 Data URL 存在 `Mistake.imageDataUrl`，会放大 IndexedDB 占用；大量图片建议后续迁移到独立 Blob 表。
- 清除数据会删除考试、考点、错题、复习项和复习记录，保留主题设置。
- 备份提醒基于 `settings.lastExportAt`，超过 14 天会在今日页提示。

维护者：星河一叶Roxy · ck_xuv@vip.qq.com
