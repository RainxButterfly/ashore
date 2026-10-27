/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/shell/ExamSwitcher.tsx
 * @描述    考试切换器：在侧栏或移动端页头中快速切换当前备考目标。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import clsx from 'clsx';
import { useId } from 'react';
import type { Exam } from '../../core/types';
import { usePreferences } from '../../stores/preferences';
import { ChevronDownIcon } from '../../ui/icons';
import styles from './ExamSwitcher.module.css';

export interface ExamSwitcherProps {
  exams: Exam[];
  activeExamId: string | null;
  compact?: boolean;
  className?: string;
}

export function ExamSwitcher({
  exams,
  activeExamId,
  compact = false,
  className,
}: ExamSwitcherProps) {
  const selectId = useId();
  const setActiveExamId = usePreferences((state) => state.setActiveExamId);

  if (exams.length === 0) {
    return null;
  }

  const activeExam = exams.find((exam) => exam.id === activeExamId) ?? exams[0];

  return (
    <div className={clsx(styles.wrapper, compact && styles.compact, className)}>
      {!compact ? (
        <label className={styles.label} htmlFor={selectId}>
          当前考试
        </label>
      ) : null}
      <div className={styles.selectWrap}>
        <select
          id={selectId}
          className={styles.select}
          value={activeExam?.id ?? ''}
          title={activeExam?.name}
          aria-label="切换当前考试"
          onChange={(event) => void setActiveExamId(event.target.value)}
        >
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={15} className={styles.chevron} />
      </div>
    </div>
  );
}
