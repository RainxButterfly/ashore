/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/hooks/useExamQueries.ts
 * @描述    响应式数据查询：从 Dexie 订阅考试、考点、错题、复习队列与记录。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import type { Exam, Mistake, ReviewCard, ReviewItem, ReviewLog, SyllabusNode } from '../core/types';
import {
  getDueCards,
  getNextDueAt,
  listExams,
  listMistakes,
  listNodes,
  listReviewItems,
  listReviewLogs,
} from '../data/repo';
import { usePreferences } from '../stores/preferences';

export function useExams(): Exam[] | undefined {
  return useLiveQuery(() => listExams(), []);
}

export interface ActiveExamResult {
  exam: Exam | null;
  exams: Exam[];
  loading: boolean;
}

export function useActiveExam(): ActiveExamResult {
  const exams = useExams();
  const activeExamId = usePreferences((state) => state.activeExamId);
  const setActiveExamId = usePreferences((state) => state.setActiveExamId);

  const exam = exams?.find((item) => item.id === activeExamId) ?? exams?.[0] ?? null;

  useEffect(() => {
    if (exam && exam.id !== activeExamId) {
      void setActiveExamId(exam.id);
    }
  }, [activeExamId, exam, setActiveExamId]);

  return {
    exam,
    exams: exams ?? [],
    loading: exams === undefined,
  };
}

export function useNodes(examId: string | null): SyllabusNode[] | undefined {
  return useLiveQuery(() => (examId ? listNodes(examId) : Promise.resolve([])), [examId]);
}

export function useMistakes(examId: string | null): Mistake[] | undefined {
  return useLiveQuery(() => (examId ? listMistakes(examId) : Promise.resolve([])), [examId]);
}

export function useReviewItems(examId: string | null): ReviewItem[] | undefined {
  return useLiveQuery(() => (examId ? listReviewItems(examId) : Promise.resolve([])), [examId]);
}

export function useDueCards(examId: string | null): ReviewCard[] | undefined {
  return useLiveQuery(() => (examId ? getDueCards(examId) : Promise.resolve([])), [examId]);
}

export function useReviewLogs(examId: string | null): ReviewLog[] | undefined {
  return useLiveQuery(() => (examId ? listReviewLogs(examId) : Promise.resolve([])), [examId]);
}

export function useNextDueAt(examId: string | null): string | null | undefined {
  return useLiveQuery(() => (examId ? getNextDueAt(examId) : Promise.resolve(null)), [examId]);
}
