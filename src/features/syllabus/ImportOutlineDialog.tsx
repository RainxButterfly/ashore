/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/syllabus/ImportOutlineDialog.tsx
 * @描述    批量导入大纲：支持缩进/标题文本与 CSV，导入前给出数量预览。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useMemo, useState } from 'react';
import type { OutlineDraft } from '../../core/outline';
import { csvRowsToDrafts, outlineToDrafts, parseCsv, parseOutline } from '../../core/outline';
import { importNodes } from '../../data/repo';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Field, Textarea } from '../../ui/Form';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { toast } from '../../ui/toast';
import styles from './ImportOutlineDialog.module.css';

type ImportMode = 'outline' | 'csv';

const MODE_OPTIONS: { value: ImportMode; label: string }[] = [
  { value: 'outline', label: '大纲文本' },
  { value: 'csv', label: 'CSV' },
];

const OUTLINE_EXAMPLE = `数据结构 | 5
  线性表 | 4
  树与二叉树 | 5
    二叉树的遍历 | 5
操作系统 | 4
  进程与线程 | 5`;

const CSV_EXAMPLE = `标题,父级,权重
数据结构,,5
线性表,数据结构,4
树与二叉树,数据结构,5`;

export interface ImportOutlineDialogProps {
  open: boolean;
  examId: string;
  onClose: () => void;
}

export function ImportOutlineDialog({ open, examId, onClose }: ImportOutlineDialogProps) {
  const [mode, setMode] = useState<ImportMode>('outline');
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);

  const drafts: OutlineDraft[] = useMemo(() => {
    if (!text.trim()) {
      return [];
    }

    return mode === 'outline'
      ? outlineToDrafts(parseOutline(text))
      : csvRowsToDrafts(parseCsv(text));
  }, [mode, text]);

  const handleImport = async () => {
    if (drafts.length === 0) {
      toast.error('没有解析到可导入的考点');
      return;
    }

    setImporting(true);
    try {
      const count = await importNodes(examId, drafts);
      toast.success(`已导入 ${count} 个考点`);
      setText('');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败，请检查格式');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="导入大纲"
      description="每行一个考点；用缩进或标题层级表示父子关系，行尾可用 | 5 标注权重。"
      size="lg"
      footer={
        <>
          <span className={styles.preview}>
            {text.trim() ? `已识别 ${drafts.length} 个考点` : '等待粘贴内容'}
          </span>
          <Button variant="ghost" onClick={onClose} disabled={importing}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleImport()}
            loading={importing}
            disabled={drafts.length === 0}
          >
            导入
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <SegmentedControl
          options={MODE_OPTIONS}
          value={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            setText('');
          }}
          label="导入格式"
        />

        <Field
          label={mode === 'outline' ? '大纲文本' : 'CSV 内容'}
          hint={
            mode === 'outline'
              ? '两个空格表示下一级；行尾 | 数字 设置权重（1–5）。'
              : '列顺序为 标题、父级、权重；父级留空表示顶层。'
          }
        >
          <Textarea
            className={styles.textarea}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={mode === 'outline' ? OUTLINE_EXAMPLE : CSV_EXAMPLE}
            aria-label={mode === 'outline' ? '大纲文本' : 'CSV 内容'}
          />
        </Field>

        <div className={styles.example}>
          <span className={styles.exampleLabel}>示例</span>
          <pre>{mode === 'outline' ? OUTLINE_EXAMPLE : CSV_EXAMPLE}</pre>
        </div>
      </div>
    </Dialog>
  );
}
