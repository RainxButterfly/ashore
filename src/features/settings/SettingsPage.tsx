/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/settings/SettingsPage.tsx
 * @描述    设置页：考试管理、外观、数据备份与关于信息，移动端保持低密度分组。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  APP_AUTHOR,
  APP_EMAIL,
  APP_LICENSE,
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
} from '../../constants';
import { formatDate, formatShortDate, toDateKey } from '../../core/dates';
import type { Exam, ExportBundle, ThemeMode } from '../../core/types';
import {
  clearAllData,
  deleteExam,
  exportAll,
  getDataCounts,
  getSetting,
  importAll,
  parseImportBundle,
  setSetting,
  SETTING_KEYS,
} from '../../data/repo';
import { seedSampleData } from '../../data/seed';
import { useActiveExam } from '../../hooks/useExamQueries';
import { usePreferences } from '../../stores/preferences';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { EmptyState } from '../../ui/EmptyState';
import {
  CalendarIcon,
  DownloadIcon,
  MonitorIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  ShieldIcon,
  StarIcon,
  SunIcon,
  TrashIcon,
  UploadIcon,
} from '../../ui/icons';
import { BrandMark } from '../../ui/Logo';
import { PageHeader } from '../../ui/PageHeader';
import { SegmentedControl, type SegmentOption } from '../../ui/SegmentedControl';
import { PageSkeleton } from '../../ui/Skeleton';
import { toast } from '../../ui/toast';
import common from '../../styles/common.module.css';
import { ExamDialog } from '../exams/ExamDialog';
import styles from './SettingsPage.module.css';

const THEME_OPTIONS: SegmentOption<ThemeMode>[] = [
  { value: 'system', label: '跟随系统', icon: <MonitorIcon size={14} /> },
  { value: 'light', label: '浅色', icon: <SunIcon size={14} /> },
  { value: 'dark', label: '深色', icon: <MoonIcon size={14} /> },
];

export default function SettingsPage() {
  const { exams, exam: activeExam, loading } = useActiveExam();
  const counts = useLiveQuery(() => getDataCounts(), []);
  const lastExportAt = useLiveQuery(
    () => getSetting<string | null>(SETTING_KEYS.lastExportAt, null),
    [],
  );
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const setActiveExamId = usePreferences((state) => state.setActiveExamId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteExamTarget, setDeleteExamTarget] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState(false);
  const [importPreview, setImportPreview] = useState<ExportBundle | null>(null);
  const [importing, setImporting] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [sampling, setSampling] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (loading || counts === undefined || exams === undefined) {
    return <PageSkeleton />;
  }

  const openCreateExam = () => {
    setEditingExam(null);
    setExamDialogOpen(true);
  };

  const openEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setExamDialogOpen(true);
  };

  const closeExamDialog = () => {
    setExamDialogOpen(false);
    setEditingExam(null);
  };

  const handleDeleteExam = async () => {
    if (!deleteExamTarget) {
      return;
    }

    setDeletingExam(true);
    try {
      await deleteExam(deleteExamTarget.id);
      toast.success('考试已删除');
      setDeleteExamTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败，请稍后再试');
    } finally {
      setDeletingExam(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const bundle = await exportAll();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ashore-backup-${toDateKey(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      await setSetting(SETTING_KEYS.lastExportAt, new Date().toISOString());
      toast.success('备份已导出');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导出失败，请稍后再试');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('备份文件不能超过 20MB');
      return;
    }

    try {
      const raw = await file.text();
      setImportPreview(parseImportBundle(raw));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '无法读取备份文件');
    }
  };

  const handleImportConfirm = async () => {
    if (!importPreview) {
      return;
    }

    setImporting(true);
    try {
      await importAll(importPreview);
      setImportPreview(null);
      toast.success('备份已导入，正在重新载入');
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败，请检查备份文件');
    } finally {
      setImporting(false);
    }
  };

  const handleSample = async () => {
    setSampling(true);
    try {
      await seedSampleData();
      setSampleOpen(false);
      toast.success('示例考试已载入');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '示例数据载入失败');
    } finally {
      setSampling(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearAllData();
      setClearOpen(false);
      toast.success('本地数据已清空');
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '清空失败，请稍后再试');
    } finally {
      setClearing(false);
    }
  };

  const previewSummary = importPreview
    ? `${importPreview.data.exams.length} 场考试、${importPreview.data.nodes.length} 个考点、${importPreview.data.mistakes.length} 道错题、${importPreview.data.reviewLogs.length} 条复习记录`
    : '';

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="偏好与数据"
        title="设置"
        description="管理考试、外观和本地数据。Ashore 不会把任何内容上传到服务器。"
      />

      <section className={common.card}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionIcon}>
              <CalendarIcon size={18} />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>考试</h2>
              <p className={styles.sectionDescription}>每场考试拥有独立的考点、错题和复习记录。</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusIcon size={15} />}
            onClick={openCreateExam}
          >
            添加
          </Button>
        </div>

        <div className={styles.sectionBody}>
          {exams.length === 0 ? (
            <EmptyState
              compact
              icon={<CalendarIcon size={22} />}
              title="还没有考试"
              description="创建一场考试，开始记录考点和错题。"
              action={
                <Button variant="primary" size="sm" onClick={openCreateExam}>
                  创建考试
                </Button>
              }
            />
          ) : (
            exams.map((item) => (
              <div key={item.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>
                    {item.name}
                    {item.id === activeExam?.id ? <Badge tone="accent">当前</Badge> : null}
                  </div>
                  <div className={styles.rowMeta}>
                    {item.category} · {formatDate(item.examDate)}
                    {item.targetScore !== null ? ` · 目标 ${item.targetScore} 分` : ''}
                  </div>
                </div>
                <div className={styles.rowActions}>
                  {item.id !== activeExam?.id ? (
                    <Button variant="ghost" size="sm" onClick={() => void setActiveExamId(item.id)}>
                      设为当前
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<PencilIcon size={14} />}
                    onClick={() => openEditExam(item)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<TrashIcon size={14} />}
                    onClick={() => setDeleteExamTarget(item)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={common.card}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionIcon}>
              <SunIcon size={18} />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>外观</h2>
              <p className={styles.sectionDescription}>主题会立即生效，并跟随本机偏好保存。</p>
            </div>
          </div>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.themeRow}>
            <span className={styles.themeLabel}>主题</span>
            <SegmentedControl
              options={THEME_OPTIONS}
              value={theme}
              onChange={(nextTheme) => void setTheme(nextTheme)}
              label="主题模式"
            />
          </div>
        </div>
      </section>

      <section className={common.card}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionIcon}>
              <ShieldIcon size={18} />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>数据</h2>
              <p className={styles.sectionDescription}>导出 JSON 备份，或从备份恢复全部数据。</p>
            </div>
          </div>
        </div>

        <div className={styles.sectionBody}>
          <div className={styles.dataStats}>
            <div className={styles.dataStat}>
              <strong>{counts.exams}</strong>
              <span>考试</span>
            </div>
            <div className={styles.dataStat}>
              <strong>{counts.nodes}</strong>
              <span>考点</span>
            </div>
            <div className={styles.dataStat}>
              <strong>{counts.mistakes}</strong>
              <span>错题</span>
            </div>
            <div className={styles.dataStat}>
              <strong>{counts.reviewLogs}</strong>
              <span>复习记录</span>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowMain}>
              <div className={styles.rowTitle}>导出备份</div>
              <div className={styles.rowMeta}>
                {lastExportAt ? `上次导出：${formatShortDate(lastExportAt)}` : '还没有导出过备份'}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<DownloadIcon size={15} />}
              loading={exporting}
              onClick={() => void handleExport()}
            >
              导出 JSON
            </Button>
          </div>

          <div className={styles.row}>
            <div className={styles.rowMain}>
              <div className={styles.rowTitle}>导入备份</div>
              <div className={styles.rowMeta}>导入会覆盖当前全部数据，建议先导出一份。</div>
            </div>
            <div className={styles.rowActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => void handleImportFile(event)}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<UploadIcon size={15} />}
                onClick={() => fileInputRef.current?.click()}
              >
                选择文件
              </Button>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowMain}>
              <div className={styles.rowTitle}>载入示例考试</div>
              <div className={styles.rowMeta}>新增一场示例考试，不影响现有数据。</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<StarIcon size={15} />}
              onClick={() => setSampleOpen(true)}
            >
              载入
            </Button>
          </div>

          <div className={styles.row}>
            <div className={styles.rowMain}>
              <div className={styles.rowTitle}>清空本地数据</div>
              <div className={styles.rowMeta}>删除全部考试、考点、错题和复习记录，无法恢复。</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={styles.dangerButton}
              icon={<TrashIcon size={15} />}
              onClick={() => setClearOpen(true)}
            >
              清空
            </Button>
          </div>
        </div>
      </section>

      <section className={common.card}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionIcon}>
              <StarIcon size={18} />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>关于</h2>
              <p className={styles.sectionDescription}>开源、本地优先的备考工作台。</p>
            </div>
          </div>
        </div>

        <div className={styles.sectionBody}>
          <div className={styles.aboutTop}>
            <BrandMark size={42} />
            <div>
              <div className={styles.aboutName}>
                {APP_NAME} · 上岸
                <span className={styles.aboutVersion}>v{APP_VERSION}</span>
              </div>
              <p className={styles.aboutTagline}>{APP_TAGLINE}</p>
            </div>
          </div>

          <div className={styles.aboutGrid}>
            <div className={styles.aboutItem}>
              <span>作者</span>
              <strong>{APP_AUTHOR}</strong>
            </div>
            <div className={styles.aboutItem}>
              <span>维护邮箱</span>
              <a href={`mailto:${APP_EMAIL}`}>{APP_EMAIL}</a>
            </div>
            <div className={styles.aboutItem}>
              <span>开源协议</span>
              <strong>{APP_LICENSE}</strong>
            </div>
            <div className={styles.aboutItem}>
              <span>数据存储</span>
              <strong>仅本机 IndexedDB</strong>
            </div>
          </div>

          <p className={styles.installHint}>
            在手机或电脑浏览器菜单里选择「安装应用 / 添加到主屏幕」，即可像本地应用一样使用。
          </p>
        </div>
      </section>

      <ExamDialog open={examDialogOpen} exam={editingExam} onClose={closeExamDialog} />

      <ConfirmDialog
        open={deleteExamTarget !== null}
        title={deleteExamTarget ? `删除「${deleteExamTarget.name}」？` : '删除考试'}
        description="会同时删除这场考试的考点、错题和复习记录，且无法恢复。建议先导出备份。"
        confirmLabel="删除考试"
        tone="danger"
        requireText="删除"
        loading={deletingExam}
        onConfirm={handleDeleteExam}
        onClose={() => setDeleteExamTarget(null)}
      />

      <ConfirmDialog
        open={importPreview !== null}
        title="导入备份？"
        description={
          previewSummary ? `将用备份中的 ${previewSummary} 覆盖当前全部数据。` : undefined
        }
        confirmLabel="覆盖并导入"
        tone="danger"
        requireText="导入"
        loading={importing}
        onConfirm={handleImportConfirm}
        onClose={() => setImportPreview(null)}
      />

      <ConfirmDialog
        open={sampleOpen}
        title="载入示例考试？"
        description="会新增一场带考点、错题和复习记录的示例考试，不影响现有数据。"
        confirmLabel="载入示例"
        loading={sampling}
        onConfirm={handleSample}
        onClose={() => setSampleOpen(false)}
      />

      <ConfirmDialog
        open={clearOpen}
        title="清空本地数据？"
        description="全部考试、考点、错题和复习记录都会被删除，无法恢复。请先确认已经导出备份。"
        confirmLabel="清空全部数据"
        tone="danger"
        requireText="清空"
        loading={clearing}
        onConfirm={handleClear}
        onClose={() => setClearOpen(false)}
      />
    </div>
  );
}
