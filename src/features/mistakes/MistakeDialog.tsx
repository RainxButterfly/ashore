/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/mistakes/MistakeDialog.tsx
 * @描述    记录/编辑错题：题干、答案、解析、来源、考点、标签与本地图片。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Mistake, SyllabusNode } from '../../core/types';
import { createMistake, updateMistake } from '../../data/repo';
import { compressImage } from '../../lib/image';
import { getNodeOptions } from '../../lib/nodes';
import { Button, IconButton } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Field, Input, Select, Textarea } from '../../ui/Form';
import { CloseIcon, ImageIcon } from '../../ui/icons';
import { toast } from '../../ui/toast';
import styles from './MistakeDialog.module.css';

export interface MistakeDialogProps {
  open: boolean;
  examId: string;
  nodes: SyllabusNode[];
  mistake?: Mistake | null;
  initialContent?: string;
  onClose: () => void;
}

interface FormState {
  content: string;
  answer: string;
  analysis: string;
  source: string;
  nodeId: string;
  imageDataUrl: string | null;
}

interface FormErrors {
  content?: string;
}

export function MistakeDialog({
  open,
  examId,
  nodes,
  mistake,
  initialContent,
  onClose,
}: MistakeDialogProps) {
  const formId = useId();
  const contentId = useId();
  const answerId = useId();
  const analysisId = useId();
  const sourceId = useId();
  const nodeId = useId();
  const tagsId = useId();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    content: '',
    answer: '',
    analysis: '',
    source: '',
    nodeId: '',
    imageDataUrl: null,
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      mistake
        ? {
            content: mistake.content,
            answer: mistake.answer,
            analysis: mistake.analysis,
            source: mistake.source,
            nodeId: mistake.nodeId ?? '',
            imageDataUrl: mistake.imageDataUrl,
          }
        : {
            content: initialContent ?? '',
            answer: '',
            analysis: '',
            source: '',
            nodeId: '',
            imageDataUrl: null,
          },
    );
    setTagInput(mistake?.tags.join(', ') ?? '');
    setErrors({});
  }, [initialContent, mistake, open]);

  const nodeOptions = getNodeOptions(nodes);

  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setImageBusy(true);
    try {
      const dataUrl = await compressImage(file);
      setForm((current) => ({ ...current, imageDataUrl: dataUrl }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片处理失败');
    } finally {
      setImageBusy(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.content.trim()) {
      setErrors({ content: '先把题目内容记下来' });
      return;
    }

    const tags = tagInput
      .split(/[,，\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);

    const draft = {
      nodeId: form.nodeId || null,
      content: form.content,
      answer: form.answer,
      analysis: form.analysis,
      source: form.source,
      tags,
      imageDataUrl: form.imageDataUrl,
    };

    setSaving(true);
    try {
      if (mistake) {
        await updateMistake(mistake.id, draft);
        toast.success('错题已更新');
      } else {
        await createMistake(examId, draft);
        toast.success('已记下，并加入今日复习');
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
      title={mistake ? '编辑错题' : '记一道错题'}
      description="不用写得很完整，先记下来。关联考点后会自动进入复习队列。"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={saving}>
            {mistake ? '保存修改' : '收进错题本'}
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <Field
          label="题目内容"
          htmlFor={contentId}
          error={errors.content}
          hint="题干、自己的错误答案或关键条件都可以。"
        >
          <Textarea
            id={contentId}
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({ ...current, content: event.target.value }))
            }
            placeholder="例如：在含 n 个结点的二叉链表中，空指针域一共有多少个？"
            invalid={Boolean(errors.content)}
          />
        </Field>

        <Field label="正确答案 / 正确思路" htmlFor={answerId}>
          <Textarea
            id={answerId}
            value={form.answer}
            onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
            placeholder="写下正确结论或解题步骤"
          />
        </Field>

        <Field label="解析与易错点" htmlFor={analysisId} optional>
          <Textarea
            id={analysisId}
            value={form.analysis}
            onChange={(event) =>
              setForm((current) => ({ ...current, analysis: event.target.value }))
            }
            placeholder="为什么错、下次怎么避免"
          />
        </Field>

        <div className={styles.twoCols}>
          <Field label="关联考点" htmlFor={nodeId}>
            <Select
              id={nodeId}
              value={form.nodeId}
              onChange={(event) =>
                setForm((current) => ({ ...current, nodeId: event.target.value }))
              }
            >
              <option value="">不关联考点</option>
              {nodeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="来源" htmlFor={sourceId} optional>
            <Input
              id={sourceId}
              value={form.source}
              onChange={(event) =>
                setForm((current) => ({ ...current, source: event.target.value }))
              }
              placeholder="例如：2024 真题 · 选择题"
            />
          </Field>
        </div>

        <Field label="标签" htmlFor={tagsId} optional hint="用逗号或空格分隔，最多 8 个。">
          <Input
            id={tagsId}
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder="树, 指针"
          />
        </Field>

        <Field label="题目图片" optional hint="图片只在本机压缩和保存，不会上传。">
          <div className={styles.imageRow}>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void handleImage(event)}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<ImageIcon size={16} />}
              loading={imageBusy}
              onClick={() => imageInputRef.current?.click()}
            >
              选择图片
            </Button>
            {form.imageDataUrl ? (
              <div className={styles.preview}>
                <img src={form.imageDataUrl} alt="错题图片预览" className={styles.previewImage} />
                <IconButton
                  label="移除图片"
                  icon={<CloseIcon size={15} />}
                  variant="secondary"
                  size="sm"
                  className={styles.previewRemove}
                  onClick={() => setForm((current) => ({ ...current, imageDataUrl: null }))}
                />
              </div>
            ) : (
              <span className={styles.imageHint}>可选，支持 JPG / PNG</span>
            )}
          </div>
        </Field>
      </form>
    </Dialog>
  );
}
