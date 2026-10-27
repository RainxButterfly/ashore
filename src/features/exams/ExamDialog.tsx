/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/exams/ExamDialog.tsx
 * @描述    创建/编辑考试：名称、类别、日期与目标分，保存后同步当前考试。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { addDays, parseDateOnly, toDateKey } from '../../core/dates';
import { EXAM_CATEGORIES, type Exam, type ExamCategory, type ExamDraft } from '../../core/types';
import { createExam, updateExam } from '../../data/repo';
import { usePreferences } from '../../stores/preferences';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Field, Input, Select } from '../../ui/Form';
import { toast } from '../../ui/toast';
import styles from './ExamDialog.module.css';

export interface ExamDialogProps {
  open: boolean;
  exam?: Exam | null;
  onClose: () => void;
}

interface FormState {
  name: string;
  category: ExamCategory;
  examDate: string;
  targetScore: string;
}

interface FormErrors {
  name?: string;
  examDate?: string;
  targetScore?: string;
}

const NEW_FORM: FormState = {
  name: '',
  category: '考研',
  examDate: toDateKey(addDays(new Date(), 60)),
  targetScore: '',
};

export function ExamDialog({ open, exam, onClose }: ExamDialogProps) {
  const formId = useId();
  const nameId = useId();
  const categoryId = useId();
  const dateId = useId();
  const scoreId = useId();
  const setActiveExamId = usePreferences((state) => state.setActiveExamId);

  const [form, setForm] = useState<FormState>(NEW_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      exam
        ? {
            name: exam.name,
            category: exam.category,
            examDate: exam.examDate,
            targetScore: exam.targetScore === null ? '' : String(exam.targetScore),
          }
        : NEW_FORM,
    );
    setErrors({});
  }, [exam, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const name = form.name.trim();
    const date = parseDateOnly(form.examDate);
    const score = form.targetScore.trim() === '' ? null : Number(form.targetScore);

    if (!name) {
      nextErrors.name = '给这场考试起个名字';
    }
    if (!date) {
      nextErrors.examDate = '选择有效的考试日期';
    }
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 1000)) {
      nextErrors.targetScore = '目标分请填写 0–1000 之间的数字';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const draft: ExamDraft = {
      name,
      category: form.category,
      examDate: form.examDate,
      targetScore: score,
    };

    setSaving(true);

    try {
      if (exam) {
        await updateExam(exam.id, draft);
        toast.success('考试信息已更新');
      } else {
        const created = await createExam(draft);
        await setActiveExamId(created.id);
        toast.success('考试已创建');
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={exam ? '编辑考试' : '创建考试'}
      description="倒计时按本地日期计算，之后可以随时修改。"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={saving}>
            {exam ? '保存修改' : '创建考试'}
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <Field label="考试名称" htmlFor={nameId} error={errors.name}>
          <Input
            id={nameId}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="例如：2027 考研 · 计算机"
            invalid={Boolean(errors.name)}
            autoComplete="off"
          />
        </Field>

        <Field label="考试类别" htmlFor={categoryId}>
          <Select
            id={categoryId}
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value as ExamCategory,
              }))
            }
          >
            {EXAM_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="考试日期"
          htmlFor={dateId}
          error={errors.examDate}
          hint="首页会用这个日期显示倒计时。"
        >
          <Input
            id={dateId}
            type="date"
            value={form.examDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, examDate: event.target.value }))
            }
            invalid={Boolean(errors.examDate)}
          />
        </Field>

        <Field
          label="目标分"
          htmlFor={scoreId}
          optional
          error={errors.targetScore}
          hint="只用来提醒自己，不影响复习调度。"
        >
          <Input
            id={scoreId}
            type="number"
            min={0}
            max={1000}
            inputMode="numeric"
            value={form.targetScore}
            onChange={(event) =>
              setForm((current) => ({ ...current, targetScore: event.target.value }))
            }
            placeholder="例如：360"
            invalid={Boolean(errors.targetScore)}
          />
        </Field>
      </form>
    </Dialog>
  );
}
