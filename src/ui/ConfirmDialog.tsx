/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/ui/ConfirmDialog.tsx
 * @描述    确认对话框：危险操作二次确认，支持输入指定文本后才可继续。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Field, Input } from './Form';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  requireText?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  tone = 'primary',
  requireText,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (open) {
      setTyped('');
    }
  }, [open]);

  const canConfirm = !requireText || typed.trim() === requireText;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => void onConfirm()}
            loading={loading}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {requireText ? (
        <Field label={`请输入「${requireText}」以确认`}>
          <Input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={requireText}
            autoComplete="off"
          />
        </Field>
      ) : null}
    </Dialog>
  );
}
