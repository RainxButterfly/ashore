/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/today/TodayPage.tsx
 * @描述    今日页：倒计时、上岸指数、今日队列、快速记错题与薄弱考点。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { computeCoverage, computeReadiness, getWeakNodes, masteryTone } from '../../core/readiness';
import {
  computeStreak,
  daysUntil,
  formatDate,
  formatDueLabel,
  getGreeting,
  lastNDays,
  toDateKey,
} from '../../core/dates';
import type { SyllabusNode } from '../../core/types';
import { createMistake, getSetting, SETTING_KEYS } from '../../data/repo';
import { seedSampleData } from '../../data/seed';
import {
  useActiveExam,
  useDueCards,
  useMistakes,
  useNextDueAt,
  useNodes,
  useReviewLogs,
} from '../../hooks/useExamQueries';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Textarea } from '../../ui/Form';
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  FlameIcon,
  PencilIcon,
  PlusIcon,
  RepeatIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
} from '../../ui/icons';
import { BrandMark } from '../../ui/Logo';
import { ProgressBar } from '../../ui/ProgressBar';
import { RingProgress } from '../../ui/RingProgress';
import { PageSkeleton } from '../../ui/Skeleton';
import { toast } from '../../ui/toast';
import common from '../../styles/common.module.css';
import { ExamDialog } from '../exams/ExamDialog';
import { MistakeDialog } from '../mistakes/MistakeDialog';
import { ExamSwitcher } from '../shell/ExamSwitcher';
import styles from './TodayPage.module.css';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function progressTone(mastery: number) {
  const tone = masteryTone(mastery);
  return tone === 'good' ? 'accent' : tone;
}

function Welcome({
  onCreate,
  onSeed,
  seeding,
}: {
  onCreate: () => void;
  onSeed: () => void;
  seeding: boolean;
}) {
  return (
    <div className={styles.welcome}>
      <div className={styles.welcomeCopy}>
        <div className={styles.welcomeBrand}>
          <BrandMark size={40} />
          <span>Ashore · 上岸</span>
        </div>
        <h1 className={styles.welcomeTitle}>
          把考试大纲，
          <br />
          变成每天的任务。
        </h1>
        <p className={styles.welcomeText}>
          Ashore
          不收集你的资料。把考点、错题和复习节奏放在一个本地工作台里，看着上岸指数一点点变高。
        </p>
        <div className={styles.welcomeActions}>
          <Button variant="primary" size="lg" onClick={onCreate} icon={<PlusIcon size={17} />}>
            创建考试
          </Button>
          <Button variant="secondary" size="lg" onClick={onSeed} loading={seeding}>
            载入示例数据
          </Button>
        </div>
        <ol className={styles.welcomePoints}>
          <li>
            <span>01</span>
            建考试，写下日期与目标
          </li>
          <li>
            <span>02</span>
            录考点，标出权重和掌握度
          </li>
          <li>
            <span>03</span>
            记错题，让系统安排下一次复习
          </li>
        </ol>
      </div>

      <div className={styles.welcomePreview} aria-hidden="true">
        <div className={styles.previewLabel}>预览 · 今日</div>
        <div className={styles.previewHero}>
          <RingProgress value={0.62} size={112} />
          <div className={styles.previewCountdown}>
            <strong>53</strong>
            <span>天后考试</span>
          </div>
        </div>
        <div className={styles.previewList}>
          <div className={styles.previewTask}>
            <span className={styles.previewDot} />
            <div>
              <strong>树与二叉树</strong>
              <span>空指针域 · 第 3 次复习</span>
            </div>
          </div>
          <div className={styles.previewTask}>
            <span className={styles.previewDot} />
            <div>
              <strong>进程与线程</strong>
              <span>调度算法 · 今天到期</span>
            </div>
          </div>
          <div className={styles.previewTask}>
            <span className={styles.previewDotMuted} />
            <div>
              <strong>传输层</strong>
              <span>三次握手 · 明天</span>
            </div>
          </div>
        </div>
        <div className={styles.previewFoot}>
          <StarIcon size={14} />
          本地优先 · 数据可导出
        </div>
      </div>
    </div>
  );
}

function WeekChart({ logs }: { logs: { reviewedAt: string }[] }) {
  const days = lastNDays(7);
  const counts = days.map(
    (key) => logs.filter((log) => toDateKey(new Date(log.reviewedAt)) === key).length,
  );
  const max = Math.max(1, ...counts);
  const total = counts.reduce((sum, count) => sum + count, 0);

  return (
    <section className={common.card}>
      <div className={common.cardPad}>
        <div className={common.sectionHead}>
          <div>
            <h2 className={common.sectionTitle}>最近 7 天</h2>
            <p className={common.sectionHint}>本周共复习 {total} 次</p>
          </div>
          <RepeatIcon size={18} className={styles.sectionIcon} />
        </div>
        <div className={styles.weekChart}>
          {days.map((key, index) => {
            const count = counts[index] ?? 0;
            const height = count === 0 ? 4 : 10 + (count / max) * 38;
            const weekday = WEEKDAY_LABELS[new Date(`${key}T00:00:00`).getDay()] ?? '';
            return (
              <div key={key} className={styles.weekColumn} title={`${key} · 复习 ${count} 次`}>
                <div className={styles.weekTrack}>
                  <span
                    className={`${styles.weekBar} ${count === 0 ? styles.weekBarEmpty : ''}`}
                    style={{ height }}
                  />
                </div>
                <span className={styles.weekLabel}>{weekday}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WeakNodes({ nodes }: { nodes: SyllabusNode[] }) {
  const leafNodes = nodes.filter((node) => !nodes.some((child) => child.parentId === node.id));
  const candidates = leafNodes.length > 0 ? leafNodes : nodes;
  const weakNodes = getWeakNodes(candidates, 3);

  return (
    <section className={common.card}>
      <div className={common.cardPad}>
        <div className={common.sectionHead}>
          <div>
            <h2 className={common.sectionTitle}>最需要补的考点</h2>
            <p className={common.sectionHint}>按掌握度和权重排序</p>
          </div>
          <Link to="/syllabus" className={common.link}>
            全部考点
          </Link>
        </div>

        {weakNodes.length === 0 ? (
          <EmptyState
            compact
            icon={<TargetIcon size={22} />}
            title="还没有考点"
            description="先把大纲拆成考点，上岸指数才有计算依据。"
            action={
              <Link to="/syllabus" className={common.link}>
                去添加考点
              </Link>
            }
          />
        ) : (
          <ul className={styles.weakList}>
            {weakNodes.map((node) => (
              <li key={node.id}>
                <Link to={`/syllabus?node=${node.id}`} className={styles.weakItem}>
                  <div className={styles.weakTop}>
                    <span className={styles.weakTitle}>{node.title}</span>
                    <span className={styles.weakMeta}>
                      权重 {node.weight} · {Math.round(node.mastery * 100)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={node.mastery}
                    tone={progressTone(node.mastery)}
                    label={`${node.title}掌握度`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function TodayPage() {
  const navigate = useNavigate();
  const { exam, exams, loading } = useActiveExam();
  const nodes = useNodes(exam?.id ?? null);
  const mistakes = useMistakes(exam?.id ?? null);
  const dueCards = useDueCards(exam?.id ?? null);
  const logs = useReviewLogs(exam?.id ?? null);
  const nextDueAt = useNextDueAt(exam?.id ?? null);
  const lastExportAt = useLiveQuery(
    () => getSetting<string | null>(SETTING_KEYS.lastExportAt, null),
    [],
  );

  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [mistakeDialogOpen, setMistakeDialogOpen] = useState(false);
  const [quickContent, setQuickContent] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  if (loading || nodes === undefined || mistakes === undefined || logs === undefined) {
    return <PageSkeleton />;
  }

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedSampleData();
      toast.success('示例数据已载入');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '示例数据载入失败');
    } finally {
      setSeeding(false);
    }
  };

  if (!exam) {
    return (
      <>
        <Welcome
          onCreate={() => setExamDialogOpen(true)}
          onSeed={() => void handleSeed()}
          seeding={seeding}
        />
        <ExamDialog open={examDialogOpen} exam={null} onClose={() => setExamDialogOpen(false)} />
      </>
    );
  }

  const readiness = computeReadiness(nodes);
  const coverage = computeCoverage(nodes);
  const streak = computeStreak(logs);
  const days = daysUntil(exam.examDate);
  const dueCount = dueCards?.length ?? 0;
  const todayKey = toDateKey(new Date());
  const todayReviewed = logs.filter(
    (log) => toDateKey(new Date(log.reviewedAt)) === todayKey,
  ).length;
  const greeting = getGreeting();
  const countdown =
    days === null
      ? '考试日期待确认'
      : days > 0
        ? `距离考试还有 ${days} 天`
        : days === 0
          ? '今天就是考试日，保持节奏'
          : '考试已结束，辛苦了';

  const backupAgeDays = lastExportAt
    ? Math.floor((Date.now() - new Date(lastExportAt).getTime()) / 86_400_000)
    : null;
  const needsBackup =
    mistakes.length > 0 &&
    lastExportAt !== undefined &&
    (lastExportAt === null || (backupAgeDays !== null && backupAgeDays > 14));

  const handleQuickAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = quickContent.trim();
    if (!content) {
      toast.error('先写点题目内容');
      return;
    }

    setQuickSaving(true);
    try {
      await createMistake(exam.id, {
        nodeId: null,
        content,
        answer: '',
        analysis: '',
        source: '',
        tags: [],
        imageDataUrl: null,
      });
      setQuickContent('');
      toast.success('已加入今日复习');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败，请稍后再试');
    } finally {
      setQuickSaving(false);
    }
  };

  return (
    <div className={common.pageStack}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroMeta}>
            <Badge tone="accent">{exam.category}</Badge>
            <span className={styles.heroExamName}>{exam.name}</span>
            <span className={styles.heroDate}>
              <CalendarIcon size={14} />
              {formatDate(exam.examDate)}
            </span>
          </div>
          <h1 className={styles.heroTitle}>{greeting}，今天也向岸边靠近一点。</h1>
          <p className={styles.heroSub}>
            {countdown}
            {exam.targetScore !== null ? ` · 目标 ${exam.targetScore} 分` : ''}
          </p>
          <div className={styles.heroActions}>
            {dueCount > 0 ? (
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRightIcon size={17} />}
                onClick={() => navigate('/review')}
              >
                开始今日复习 · {dueCount}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                icon={<TargetIcon size={17} />}
                onClick={() => navigate('/syllabus')}
              >
                查看薄弱考点
              </Button>
            )}
            <Button
              variant="ghost"
              size="lg"
              icon={<PlusIcon size={17} />}
              onClick={() => setMistakeDialogOpen(true)}
            >
              记错题
            </Button>
          </div>
          <ExamSwitcher
            exams={exams}
            activeExamId={exam.id}
            compact
            className={styles.mobileExam}
          />
        </div>

        <div className={styles.heroSide}>
          <RingProgress value={readiness} label="上岸指数" />
          <div className={styles.coverage}>
            <span>考点覆盖</span>
            <strong>
              {coverage.covered} / {coverage.total}
            </strong>
          </div>
        </div>
      </section>

      <div className={common.statGrid}>
        <div className={common.stat}>
          <div className={common.statValue}>{dueCount}</div>
          <div className={common.statLabel}>今日待复习</div>
        </div>
        <div className={common.stat}>
          <div className={common.statValue}>{todayReviewed}</div>
          <div className={common.statLabel}>今日已复习</div>
        </div>
        <div className={common.stat}>
          <div className={common.statValue}>{streak}</div>
          <div className={common.statLabel}>连续复习天数</div>
        </div>
      </div>

      <div className={common.gridMain}>
        <div className={styles.leftStack}>
          <section className={common.card}>
            <div className={common.cardPad}>
              <div className={common.sectionHead}>
                <div>
                  <h2 className={common.sectionTitle}>今日复习</h2>
                  <p className={common.sectionHint}>
                    {dueCount > 0
                      ? `${dueCount} 条到期，先清空队列`
                      : nextDueAt
                        ? `下一次复习在 ${formatDueLabel(nextDueAt)}`
                        : '记录错题后会自动出现在这里'}
                  </p>
                </div>
                <Link to="/review" className={common.link}>
                  进入复习
                </Link>
              </div>

              {dueCount > 0 ? (
                <>
                  <ul className={styles.queueList}>
                    {(dueCards ?? []).slice(0, 3).map((card, index) => (
                      <li key={card.item.id} className={styles.queueItem}>
                        <span className={styles.queueIndex}>{index + 1}</span>
                        <div className={styles.queueBody}>
                          <p className={styles.queueContent}>{card.mistake.content}</p>
                          <span className={styles.queueMeta}>
                            {card.node?.title ?? '未关联考点'} · 第 {card.item.reps + 1} 次复习
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="primary"
                    icon={<RepeatIcon size={16} />}
                    onClick={() => navigate('/review')}
                  >
                    开始复习
                  </Button>
                </>
              ) : (
                <div className={styles.queueEmpty}>
                  <div className={styles.queueEmptyIcon}>
                    <ClockIcon size={22} />
                  </div>
                  <div>
                    <strong>今天的队列已经清空</strong>
                    <p>
                      {nextDueAt
                        ? `下一次复习在 ${formatDueLabel(nextDueAt)}，可以先整理错题。`
                        : '还没有错题。先记一道，系统会安排复习。'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={common.card}>
            <div className={common.cardPad}>
              <div className={common.sectionHead}>
                <div>
                  <h2 className={common.sectionTitle}>快速记错题</h2>
                  <p className={common.sectionHint}>先记下来，稍后再补答案和考点。</p>
                </div>
              </div>
              <form className={styles.quickForm} onSubmit={(event) => void handleQuickAdd(event)}>
                <Textarea
                  className={styles.quickTextarea}
                  value={quickContent}
                  onChange={(event) => setQuickContent(event.target.value)}
                  placeholder="今天错在哪？一句话记下来…"
                  aria-label="快速记录错题内容"
                />
                <div className={styles.quickActions}>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<PlusIcon size={16} />}
                    loading={quickSaving}
                  >
                    记下来
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMistakeDialogOpen(true)}
                    disabled={!quickContent.trim()}
                  >
                    补充详情
                  </Button>
                </div>
              </form>
            </div>
          </section>

          <WeakNodes nodes={nodes} />
        </div>

        <div className={styles.rightStack}>
          <section className={common.card}>
            <div className={common.cardPad}>
              <div className={common.sectionHead}>
                <div>
                  <h2 className={common.sectionTitle}>考试档案</h2>
                  <p className={common.sectionHint}>{exam.category}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<PencilIcon size={15} />}
                  onClick={() => setExamDialogOpen(true)}
                >
                  编辑
                </Button>
              </div>
              <dl className={styles.examList}>
                <div className={styles.examRow}>
                  <dt>考试日期</dt>
                  <dd>{formatDate(exam.examDate)}</dd>
                </div>
                <div className={styles.examRow}>
                  <dt>剩余天数</dt>
                  <dd>{days === null ? '—' : days >= 0 ? `${days} 天` : '已结束'}</dd>
                </div>
                <div className={styles.examRow}>
                  <dt>目标分</dt>
                  <dd>{exam.targetScore === null ? '未设置' : `${exam.targetScore} 分`}</dd>
                </div>
                <div className={styles.examRow}>
                  <dt>错题数量</dt>
                  <dd>{mistakes.length} 道</dd>
                </div>
              </dl>
            </div>
          </section>

          <WeekChart logs={logs} />

          {needsBackup ? (
            <div className={styles.backupCard}>
              <div className={styles.backupIcon}>
                <ShieldIcon size={18} />
              </div>
              <div className={styles.backupBody}>
                <strong>数据只在这台设备</strong>
                <p>
                  {backupAgeDays === null
                    ? '还没有导出过备份，换设备或清理浏览器前先存一份。'
                    : `上次备份是 ${backupAgeDays} 天前，建议再导出一份。`}
                </p>
              </div>
              <Link to="/settings" className={common.link}>
                去备份
              </Link>
            </div>
          ) : null}

          <div className={styles.streakNote}>
            <FlameIcon size={16} />
            <span>
              连续 {streak} 天{streak > 0 ? '，保持这个节奏。' : '，今天开始也不晚。'}
            </span>
          </div>
        </div>
      </div>

      <ExamDialog open={examDialogOpen} exam={exam} onClose={() => setExamDialogOpen(false)} />
      <MistakeDialog
        open={mistakeDialogOpen}
        examId={exam.id}
        nodes={nodes}
        initialContent={quickContent}
        onClose={() => setMistakeDialogOpen(false)}
      />
    </div>
  );
}
