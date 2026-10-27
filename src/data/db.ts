/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/data/db.ts
 * @描述    IndexedDB 表结构：考试、考点、错题、复习项、复习记录与设置。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import Dexie, { type Table } from 'dexie';
import type {
  Exam,
  Mistake,
  ReviewItem,
  ReviewLog,
  SettingRecord,
  SyllabusNode,
} from '../core/types';

export class AshoreDB extends Dexie {
  exams!: Table<Exam, string>;
  nodes!: Table<SyllabusNode, string>;
  mistakes!: Table<Mistake, string>;
  reviewItems!: Table<ReviewItem, string>;
  reviewLogs!: Table<ReviewLog, string>;
  settings!: Table<SettingRecord, string>;

  constructor(name = 'ashore') {
    super(name);

    this.version(1).stores({
      exams: 'id, examDate, createdAt',
      nodes: 'id, examId, parentId, [examId+order]',
      mistakes: 'id, examId, nodeId, status, createdAt',
      reviewItems: 'id, examId, mistakeId, dueAt, [examId+dueAt]',
      reviewLogs: 'id, examId, reviewedAt, mistakeId',
      settings: 'key',
    });
  }
}

export const db = new AshoreDB();
