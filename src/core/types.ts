/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/core/types.ts
 * @描述    领域类型：考试、考点、错题、复习项与导出数据的统一契约。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */

export const EXAM_CATEGORIES = ['考研', '考公', '四六级', '高考', '其他'] as const;

export type ExamCategory = (typeof EXAM_CATEGORIES)[number];

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Exam {
  id: string;
  name: string;
  category: ExamCategory;
  examDate: string;
  targetScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamDraft {
  name: string;
  category: ExamCategory;
  examDate: string;
  targetScore: number | null;
}

export interface SyllabusNode {
  id: string;
  examId: string;
  parentId: string | null;
  title: string;
  weight: number;
  mastery: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type MistakeStatus = 'active' | 'archived';

export interface Mistake {
  id: string;
  examId: string;
  nodeId: string | null;
  content: string;
  answer: string;
  analysis: string;
  source: string;
  tags: string[];
  imageDataUrl: string | null;
  status: MistakeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MistakeDraft {
  nodeId: string | null;
  content: string;
  answer: string;
  analysis: string;
  source: string;
  tags: string[];
  imageDataUrl: string | null;
}

export type Rating = 1 | 2 | 3 | 4;

export interface ReviewItem {
  id: string;
  examId: string;
  mistakeId: string;
  dueAt: string;
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  lastReviewedAt: string | null;
  createdAt: string;
}

export interface ReviewLog {
  id: string;
  examId: string;
  itemId: string;
  mistakeId: string;
  rating: Rating;
  reviewedAt: string;
  elapsedMs: number;
}

export interface ReviewCard {
  item: ReviewItem;
  mistake: Mistake;
  node: SyllabusNode | null;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface ExportBundle {
  app: 'ashore';
  schemaVersion: 1;
  exportedAt: string;
  data: {
    exams: Exam[];
    nodes: SyllabusNode[];
    mistakes: Mistake[];
    reviewItems: ReviewItem[];
    reviewLogs: ReviewLog[];
  };
}
