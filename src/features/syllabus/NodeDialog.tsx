/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/syllabus/NodeDialog.tsx
 * @描述    新增/编辑考点：标题、所属父级、权重与手动掌握度。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import type { SyllabusNode } from '../../core/types';
import { createNode, updateNode } from '../../data/repo';
import { collectDescendantIds, getNodeOptions } from '../../lib/nodes';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Field, Input, Select } from '../../ui/Form';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { toast } from '../../ui/toast';
import styles from './NodeDialog.module.css';

export interface NodeDialogProps {
  open: boolean;
  examId: string;
  nodes: SyllabusNode[];
  node?: SyllabusNode | null;
  defaultParentId?: string | null;
  onDelete?: () => void;
  onClose: () => void;
}

type WeightValue = '1' | '2' | '3' | '4' | '5';

const WEIGHT_OPTIONS: { value: WeightValue; label: string }[] = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
];

export function NodeDialog({
  open,
  examId,
  nodes,
  node,
  defaultParentId,
  onDelete,
  onClose,
}: NodeDialogProps) {
  const formId = useId();
  const titleId = useId();
  const parentId = useId();
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState<WeightValue>('3');
  const [mastery, setMastery] = useState(0);
  const [parent, setParent] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(node?.title ?? '');
    setWeight(String(node?.weight ?? 3) as WeightValue);
    setMastery(Math.round((node?.mastery ?? 0) * 100));
    setParent(node ? (node.parentId ?? '') : (defaultParentId ?? ''));
    setError('');
  }, [defaultParentId, node, open]);

  const excluded = node
    ? new Set([node.id, ...collectDescendantIds(nodes, node.id)])
    : new Set<string>();
  const parentOptions = getNodeOptions(nodes, excluded);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError('给这个考点起个名字');
      return;
    }

    setSaving(true);
    try {
      if (node) {
        await updateNode(node.id, {
          title: title.trim(),
          weight: Number(weight),
          mastery: mastery / 100,
          parentId: parent || null,
        });
        toast.success('考点已更新');
      } else {
        await createNode(examId, {
          title: title.trim(),
          weight: Number(weight),
          mastery: mastery / 100,
          parentId: parent || null,
        });
        toast.success('考点已添加');
      }
      onClose();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : '保存失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={node ? '编辑考点' : '添加考点'}
      description="权重越高，对上岸指数的影响越大；掌握度可以手动微调。"
      size="sm"
      footer={
        <>
          {node && onDelete ? (
            <Button
              variant="ghost"
              className={styles.deleteAction}
              onClick={onDelete}
              disabled={saving}
            >
              删除考点
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={saving}>
            {node ? '保存修改' : '添加考点'}
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <Field label="考点名称" htmlFor={titleId} error={error}>
          <Input
            id={titleId}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：树与二叉树"
            invalid={Boolean(error)}
          />
        </Field>

        <Field label="上级考点" htmlFor={parentId}>
          <Select id={parentId} value={parent} onChange={(event) => setParent(event.target.value)}>
            <option value="">作为顶层考点</option>
            {parentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="权重" hint="1 表示了解即可，5 表示高频核心。">
          <SegmentedControl
            options={WEIGHT_OPTIONS}
            value={weight}
            onChange={setWeight}
            label="考点权重"
          />
        </Field>

        <Field label="当前掌握度" hint="复习评分会自动微调，也可以先手动标一个大致水平。">
          <div className={styles.masteryRow}>
            <input
              className={styles.range}
              type="range"
              min={0}
              max={100}
              step={1}
              value={mastery}
              aria-label="考点掌握度"
              onChange={(event) => setMastery(Number(event.target.value))}
            />
            <span className={styles.masteryValue}>{mastery}%</span>
          </div>
        </Field>
      </form>
    </Dialog>
  );
}
