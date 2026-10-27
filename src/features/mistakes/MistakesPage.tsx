/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/mistakes/MistakesPage.tsx
 * @描述    错题本：搜索、按考点/状态筛选、编辑、归档、删除与到期提示。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import clsx from 'clsx';
import { useDeferredValue, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { endOfDay, formatDueLabel, formatShortDate } from '../../core/dates';
import type { Mistake, MistakeStatus } from '../../core/types';
import { deleteMistake, setMistakeStatus } from '../../data/repo';
import {
  useActiveExam,
  useDueCards,
  useMistakes,
  useNodes,
  useReviewItems,
} from '../../hooks/useExamQueries';
import { getNodeOptions } from '../../lib/nodes';
import { Badge } from '../../ui/Badge';
import { Button, IconButton } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { EmptyState } from '../../ui/EmptyState';
import { Select } from '../../ui/Form';
import {
  ArchiveIcon,
  ImageIcon,
  NotebookIcon,
  PencilIcon,
  PlusIcon,
  RepeatIcon,
  TrashIcon,
} from '../../ui/icons';
import { PageHeader } from '../../ui/PageHeader';
import { SearchInput } from '../../ui/SearchInput';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { PageSkeleton } from '../../ui/Skeleton';
import { toast } from '../../ui/toast';
import common from '../../styles/common.module.css';
import { ExamDialog } from '../exams/ExamDialog';
import { MistakeDialog } from './MistakeDialog';
import styles from './MistakesPage.module.css';

type StatusFilter = 'all' | MistakeStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '复习中' },
  { value: 'archived', label: '已归档' },
];

export default function MistakesPage() {
  const { exam, loading } = useActiveExam();
  const nodes = useNodes(exam?.id ?? null);
  const mistakes = useMistakes(exam?.id ?? null);
  const reviewItems = useReviewItems(exam?.id ?? null);
  const dueCards = useDueCards(exam?.id ?? null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [nodeFilter, setNodeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMistake, setEditingMistake] = useState<Mistake | null>(null);
  const [initialContent, setInitialContent] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Mistake | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const newParam = searchParams.get('new');
  const nodeParam = searchParams.get('node');
  const contentParam = searchParams.get('content');

  useEffect(() => {
    if (!exam) {
      return;
    }

    if (newParam === '1') {
      setEditingMistake(null);
      setInitialContent(contentParam ?? '');
      setDialogOpen(true);
    }
    if (nodeParam) {
      setNodeFilter(nodeParam);
    }
    if (newParam || nodeParam || contentParam) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete('new');
          next.delete('node');
          next.delete('content');
          return next;
        },
        { replace: true },
      );
    }
  }, [contentParam, exam, newParam, nodeParam, setSearchParams]);

  if (loading || nodes === undefined || mistakes === undefined || reviewItems === undefined) {
    return <PageSkeleton />;
  }

  if (!exam) {
    return (
      <div className={common.pageStack}>
        <PageHeader
          eyebrow="错题驱动"
          title="错题本"
          description="把错题和考点连起来，系统会自动安排下一次复习。"
        />
        <EmptyState
          icon={<NotebookIcon size={22} />}
          title="还没有考试"
          description="创建考试后，才能把错题关联到考点并安排复习。"
          action={
            <Button variant="primary" onClick={() => setExamDialogOpen(true)}>
              创建考试
            </Button>
          }
        />
        <ExamDialog open={examDialogOpen} exam={null} onClose={() => setExamDialogOpen(false)} />
      </div>
    );
  }

  const nodeOptions = getNodeOptions(nodes);
  const nodeTitleById = new Map(nodes.map((node) => [node.id, node.title]));
  const itemByMistake = new Map(reviewItems.map((item) => [item.mistakeId, item]));
  const dueCount = dueCards?.length ?? 0;
  const archivedCount = mistakes.filter((mistake) => mistake.status === 'archived').length;

  const filtered = mistakes.filter((mistake) => {
    const haystack =
      `${mistake.content} ${mistake.answer} ${mistake.analysis} ${mistake.source} ${mistake.tags.join(' ')}`.toLowerCase();
    const matchesSearch = !deferredSearch || haystack.includes(deferredSearch);
    const matchesStatus = statusFilter === 'all' || mistake.status === statusFilter;
    const matchesNode = !nodeFilter || mistake.nodeId === nodeFilter;
    return matchesSearch && matchesStatus && matchesNode;
  });

  const isFiltering = deferredSearch.length > 0 || statusFilter !== 'all' || Boolean(nodeFilter);

  const openNew = () => {
    setEditingMistake(null);
    setInitialContent('');
    setDialogOpen(true);
  };

  const openEdit = (mistake: Mistake) => {
    setEditingMistake(mistake);
    setInitialContent('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingMistake(null);
    setInitialContent('');
  };

  const toggleStatus = async (mistake: Mistake) => {
    const nextStatus: MistakeStatus = mistake.status === 'active' ? 'archived' : 'active';
    try {
      await setMistakeStatus(mistake.id, nextStatus);
      toast.success(nextStatus === 'archived' ? '已归档，不再进入复习队列' : '已恢复到复习队列');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败，请稍后再试');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      await deleteMistake(deleteTarget.id);
      toast.success('错题已删除');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败，请稍后再试');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={common.pageStack}>
      <PageHeader
        eyebrow="错题驱动"
        title="错题本"
        description="记录错误、关联考点，让复习队列自动排期。"
        actions={
          <Button variant="primary" icon={<PlusIcon size={16} />} onClick={openNew}>
            记错题
          </Button>
        }
      />

      <div className={common.statGrid}>
        <div className={common.stat}>
          <div className={common.statValue}>{mistakes.length}</div>
          <div className={common.statLabel}>错题总数</div>
        </div>
        <div className={common.stat}>
          <div className={common.statValue}>{dueCount}</div>
          <div className={common.statLabel}>今日到期</div>
        </div>
        <div className={common.stat}>
          <div className={common.statValue}>{archivedCount}</div>
          <div className={common.statLabel}>已归档</div>
        </div>
      </div>

      <section className={common.card}>
        <div className={styles.toolbar}>
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索题目、答案或标签"
            aria-label="搜索错题"
            wrapperClassName={styles.search}
          />

          <SegmentedControl
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            label="按状态筛选"
          />

          <div className={styles.nodeFilter}>
            <Select
              value={nodeFilter}
              onChange={(event) => setNodeFilter(event.target.value)}
              aria-label="按考点筛选"
            >
              <option value="">全部考点</option>
              {nodeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.toolbarRight}>
            <span className={styles.resultCount}>
              {isFiltering ? `${filtered.length} 道结果` : `共 ${mistakes.length} 道`}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          mistakes.length === 0 ? (
            <EmptyState
              icon={<NotebookIcon size={22} />}
              title="错题本还是空的"
              description="先记一道错题。哪怕只写题干，之后再补答案和考点也可以。"
              action={
                <Button variant="primary" icon={<PlusIcon size={16} />} onClick={openNew}>
                  记第一道错题
                </Button>
              }
            />
          ) : (
            <EmptyState
              compact
              icon={<NotebookIcon size={22} />}
              title="没有匹配的错题"
              description="换个关键词，或者把筛选条件改回全部。"
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setNodeFilter('');
                  }}
                >
                  清除筛选
                </Button>
              }
            />
          )
        ) : (
          <div className={styles.list}>
            {filtered.map((mistake) => {
              const item = itemByMistake.get(mistake.id);
              const nodeTitle = mistake.nodeId
                ? (nodeTitleById.get(mistake.nodeId) ?? '未知考点')
                : '未关联考点';
              const dueToday = item
                ? new Date(item.dueAt).getTime() <= endOfDay(new Date()).getTime()
                : false;

              return (
                <article
                  key={mistake.id}
                  className={clsx(styles.card, mistake.status === 'archived' && styles.archived)}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.meta}>
                      <Badge tone={mistake.nodeId ? 'accent' : 'neutral'}>{nodeTitle}</Badge>
                      {mistake.source ? (
                        <span className={styles.source}>{mistake.source}</span>
                      ) : null}
                      {mistake.status === 'archived' ? (
                        <Badge>已归档</Badge>
                      ) : item ? (
                        <Badge tone={dueToday ? 'warning' : 'info'}>
                          {dueToday ? '今天到期' : `下次 ${formatDueLabel(item.dueAt)}`}
                        </Badge>
                      ) : null}
                    </div>

                    <div className={styles.actions}>
                      <IconButton
                        label="编辑错题"
                        icon={<PencilIcon size={15} />}
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(mistake)}
                      />
                      <IconButton
                        label={mistake.status === 'archived' ? '恢复到复习队列' : '归档错题'}
                        icon={
                          mistake.status === 'archived' ? (
                            <RepeatIcon size={15} />
                          ) : (
                            <ArchiveIcon size={15} />
                          )
                        }
                        variant="ghost"
                        size="sm"
                        onClick={() => void toggleStatus(mistake)}
                      />
                      <IconButton
                        label="删除错题"
                        icon={<TrashIcon size={15} />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(mistake)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.content}
                    onClick={() => openEdit(mistake)}
                  >
                    {mistake.content}
                  </button>

                  <div className={styles.bottom}>
                    <div className={styles.tags}>
                      {mistake.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                          #{tag}
                        </span>
                      ))}
                      {mistake.imageDataUrl ? (
                        <span className={styles.imageTag}>
                          <ImageIcon size={12} />
                          图片
                        </span>
                      ) : null}
                    </div>
                    <span className={styles.created}>
                      {formatShortDate(mistake.createdAt)} 记录
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <MistakeDialog
        open={dialogOpen}
        examId={exam.id}
        nodes={nodes}
        mistake={editingMistake}
        initialContent={initialContent}
        onClose={closeDialog}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除这道错题？"
        description="删除后不会再进入复习队列；已经产生的复习记录会保留在统计里。"
        confirmLabel="删除错题"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
