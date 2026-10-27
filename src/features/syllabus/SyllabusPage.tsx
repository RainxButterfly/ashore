/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/syllabus/SyllabusPage.tsx
 * @描述    考点页：大纲树、加权掌握度、筛选搜索、导入与增删改。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useDeferredValue, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { computeCoverage, computeReadiness, masteryTone } from '../../core/readiness';
import type { SyllabusNode } from '../../core/types';
import { deleteNode } from '../../data/repo';
import { useActiveExam, useMistakes, useNodes } from '../../hooks/useExamQueries';
import {
  buildNodeTree,
  countMistakesByNode,
  flattenVisibleTree,
  getNodePath,
  type FlatNode,
} from '../../lib/nodes';
import { Badge } from '../../ui/Badge';
import { Button, IconButton } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { EmptyState } from '../../ui/EmptyState';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  UploadIcon,
} from '../../ui/icons';
import { PageHeader } from '../../ui/PageHeader';
import { ProgressBar } from '../../ui/ProgressBar';
import { SearchInput } from '../../ui/SearchInput';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { PageSkeleton } from '../../ui/Skeleton';
import { toast } from '../../ui/toast';
import common from '../../styles/common.module.css';
import { ExamDialog } from '../exams/ExamDialog';
import { ImportOutlineDialog } from './ImportOutlineDialog';
import { NodeDialog } from './NodeDialog';
import styles from './SyllabusPage.module.css';

type FilterValue = 'all' | 'weak' | 'unreviewed';

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'weak', label: '薄弱' },
  { value: 'unreviewed', label: '未复习' },
];

function progressTone(mastery: number) {
  const tone = masteryTone(mastery);
  return tone === 'good' ? 'accent' : tone;
}

export default function SyllabusPage() {
  const { exam, loading } = useActiveExam();
  const nodes = useNodes(exam?.id ?? null);
  const mistakes = useMistakes(exam?.id ?? null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<SyllabusNode | null>(null);
  const [parentForNew, setParentForNew] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SyllabusNode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const focusNodeId = searchParams.get('node');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    if (!focusNodeId || !nodes) {
      return;
    }

    const target = nodes.find((node) => node.id === focusNodeId);
    if (target) {
      setEditingNode(target);
      setParentForNew(null);
      setNodeDialogOpen(true);
    }

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('node');
        return next;
      },
      { replace: true },
    );
  }, [focusNodeId, nodes, setSearchParams]);

  if (loading || nodes === undefined || mistakes === undefined) {
    return <PageSkeleton />;
  }

  if (!exam) {
    return (
      <div className={common.pageStack}>
        <PageHeader
          eyebrow="备考地图"
          title="考点"
          description="先把考试建起来，再把大纲拆成可以复习的单元。"
        />
        <EmptyState
          icon={<LayersIcon size={22} />}
          title="还没有考试"
          description="创建考试后，就可以录入考点、导入大纲并计算上岸指数。"
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

  const readiness = computeReadiness(nodes);
  const coverage = computeCoverage(nodes);
  const weakCount = nodes.filter((node) => node.mastery < 0.5).length;
  const mistakeCounts = countMistakesByNode(mistakes);
  const parentIds = nodes
    .filter((node) => nodes.some((child) => child.parentId === node.id))
    .map((node) => node.id);

  const filteredNodes = nodes.filter((node) => {
    const matchesSearch = !deferredSearch || node.title.toLowerCase().includes(deferredSearch);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'weak' && node.mastery < 0.5) ||
      (filter === 'unreviewed' && node.mastery < 0.05);
    return matchesSearch && matchesFilter;
  });

  const isFiltering = deferredSearch.length > 0 || filter !== 'all';
  const rows: (FlatNode & { path?: string })[] = isFiltering
    ? filteredNodes.map((node) => ({
        node,
        depth: 0,
        path: getNodePath(nodes, node.id),
      }))
    : flattenVisibleTree(buildNodeTree(nodes), collapsed);

  const allExpanded = collapsed.size === 0;

  const openCreate = (parentId: string | null) => {
    setEditingNode(null);
    setParentForNew(parentId);
    setNodeDialogOpen(true);
  };

  const openEdit = (node: SyllabusNode) => {
    setEditingNode(node);
    setParentForNew(null);
    setNodeDialogOpen(true);
  };

  const closeNodeDialog = () => {
    setNodeDialogOpen(false);
    setEditingNode(null);
    setParentForNew(null);
  };

  const requestDelete = () => {
    if (!editingNode) {
      return;
    }
    setDeleteTarget(editingNode);
    closeNodeDialog();
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      await deleteNode(deleteTarget.id);
      toast.success('考点已删除');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败，请稍后再试');
    } finally {
      setDeleting(false);
    }
  };

  const toggleCollapsed = (nodeId: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  return (
    <div className={common.pageStack}>
      <PageHeader
        eyebrow="备考地图"
        title="考点"
        description={`已覆盖 ${coverage.covered} / ${coverage.total} 个考点。权重越高，对上岸指数的影响越大。`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<UploadIcon size={16} />}
              onClick={() => setImportOpen(true)}
            >
              导入大纲
            </Button>
            <Button
              variant="primary"
              icon={<PlusIcon size={16} />}
              onClick={() => openCreate(null)}
            >
              添加考点
            </Button>
          </>
        }
      />

      <div className={common.statGrid}>
        <div className={common.stat}>
          <div className={common.statValue}>{nodes.length}</div>
          <div className={common.statLabel}>考点总数</div>
        </div>
        <div className={common.stat}>
          <div className={common.statValue}>{Math.round(readiness * 100)}%</div>
          <div className={common.statLabel}>加权掌握度</div>
        </div>
        <div className={common.stat}>
          <div className={common.statValue}>{weakCount}</div>
          <div className={common.statLabel}>掌握度低于 50%</div>
        </div>
      </div>

      <section className={common.card}>
        <div className={styles.toolbar}>
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索考点"
            aria-label="搜索考点"
            wrapperClassName={styles.search}
          />
          <SegmentedControl
            options={FILTER_OPTIONS}
            value={filter}
            onChange={setFilter}
            label="筛选考点"
          />
          <div className={styles.toolbarRight}>
            <span className={styles.resultCount}>
              {isFiltering ? `${rows.length} 个结果` : `${nodes.length} 个考点`}
            </span>
            {!isFiltering && parentIds.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(allExpanded ? new Set(parentIds) : new Set())}
              >
                {allExpanded ? '收起全部' : '展开全部'}
              </Button>
            ) : null}
          </div>
        </div>

        {rows.length === 0 ? (
          nodes.length === 0 ? (
            <EmptyState
              icon={<LayersIcon size={22} />}
              title="还没有考点"
              description="把大纲拆成考点，标上权重和掌握度，上岸指数才有计算依据。"
              action={
                <div className={styles.emptyActions}>
                  <Button
                    variant="primary"
                    icon={<PlusIcon size={16} />}
                    onClick={() => openCreate(null)}
                  >
                    添加第一个考点
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<UploadIcon size={16} />}
                    onClick={() => setImportOpen(true)}
                  >
                    导入大纲
                  </Button>
                </div>
              }
            />
          ) : (
            <EmptyState
              compact
              icon={<LayersIcon size={22} />}
              title="没有匹配的考点"
              description="换个关键词，或者把筛选条件改回全部。"
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setFilter('all');
                  }}
                >
                  清除筛选
                </Button>
              }
            />
          )
        ) : (
          <ul className={styles.treeList}>
            {rows.map(({ node, depth, path }) => {
              const children = nodes.filter((child) => child.parentId === node.id);
              const isCollapsed = collapsed.has(node.id);
              const nodeMistakes = mistakeCounts.get(node.id) ?? 0;

              return (
                <li key={node.id}>
                  <div
                    className={styles.nodeRow}
                    style={{ paddingLeft: 10 + (isFiltering ? 0 : depth) * 18 }}
                  >
                    {!isFiltering && children.length > 0 ? (
                      <button
                        type="button"
                        className={styles.chevron}
                        aria-label={`${isCollapsed ? '展开' : '收起'}${node.title}`}
                        aria-expanded={!isCollapsed}
                        onClick={() => toggleCollapsed(node.id)}
                      >
                        {isCollapsed ? (
                          <ChevronRightIcon size={16} />
                        ) : (
                          <ChevronDownIcon size={16} />
                        )}
                      </button>
                    ) : (
                      <span className={styles.chevronPlaceholder} />
                    )}

                    <button
                      type="button"
                      className={styles.nodeMain}
                      onClick={() => openEdit(node)}
                    >
                      <span className={styles.nodeTop}>
                        <span className={styles.nodeTitle}>{node.title}</span>
                        <Badge>权重 {node.weight}</Badge>
                        <span className={styles.nodeMastery}>
                          {Math.round(node.mastery * 100)}%
                        </span>
                      </span>
                      {isFiltering ? <span className={styles.path}>{path}</span> : null}
                      <span className={styles.nodeBottom}>
                        <ProgressBar
                          value={node.mastery}
                          tone={progressTone(node.mastery)}
                          label={`${node.title}掌握度`}
                          className={styles.nodeBar}
                        />
                        <span className={styles.nodeMistakes}>
                          {nodeMistakes > 0 ? `${nodeMistakes} 道错题` : '暂无错题'}
                        </span>
                      </span>
                    </button>

                    <div className={styles.nodeActions}>
                      <IconButton
                        label={`在${node.title}下添加子考点`}
                        icon={<PlusIcon size={15} />}
                        variant="ghost"
                        size="sm"
                        onClick={() => openCreate(node.id)}
                      />
                      <IconButton
                        label={`编辑${node.title}`}
                        icon={<PencilIcon size={15} />}
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(node)}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {nodes.length > 0 ? (
          <p className={styles.footerHint}>
            点击考点可编辑；删除父级时，子考点会移动到上一级，关联错题会保留但解除关联。
          </p>
        ) : null}
      </section>

      <NodeDialog
        open={nodeDialogOpen}
        examId={exam.id}
        nodes={nodes}
        node={editingNode}
        defaultParentId={parentForNew}
        onDelete={requestDelete}
        onClose={closeNodeDialog}
      />

      <ImportOutlineDialog
        open={importOpen}
        examId={exam.id}
        onClose={() => setImportOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `删除「${deleteTarget.title}」？` : '删除考点'}
        description="子考点会移动到上一级；关联错题会保留，但不再关联这个考点。"
        confirmLabel="删除考点"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
