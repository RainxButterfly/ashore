/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/insights/InsightsPage.tsx
 * @描述    复盘页：上岸指数、复习热力图、本周节奏、薄弱考点与掌握度分布。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { Link } from 'react-router-dom';
import { addDays, computeStreak, lastNDays, startOfDay, toDateKey } from '../../core/dates';
import { computeCoverage, computeReadiness, getWeakNodes, masteryTone } from '../../core/readiness';
import type { ReviewLog, SyllabusNode } from '../../core/types';
import { useActiveExam, useNodes, useReviewLogs } from '../../hooks/useExamQueries';
import { Badge } from '../../ui/Badge';
import { EmptyState } from '../../ui/EmptyState';
import { ChartIcon, LayersIcon, StarIcon } from '../../ui/icons';
import { PageHeader } from '../../ui/PageHeader';
import { ProgressBar } from '../../ui/ProgressBar';
import { PageSkeleton } from '../../ui/Skeleton';
import common from '../../styles/common.module.css';
import styles from './InsightsPage.module.css';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

function progressTone(mastery: number) {
  const tone = masteryTone(mastery);
  return tone === 'good' ? 'accent' : tone;
}

const FILL_CLASS = {
  danger: styles.fillDanger,
  warning: styles.fillWarning,
  accent: styles.fillAccent,
  success: styles.fillSuccess,
} as const;

function heatLevel(count: number): number {
  if (count === 0) {
    return 0;
  }
  if (count <= 2) {
    return 1;
  }
  if (count <= 4) {
    return 2;
  }
  if (count <= 6) {
    return 3;
  }
  return 4;
}

function ReviewHeatmap({ logs }: { logs: ReviewLog[] }) {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const key = toDateKey(new Date(log.reviewedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const today = startOfDay(new Date());
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = addDays(today, -(mondayOffset + 77));
  const days = Array.from({ length: 84 }, (_, index) => addDays(start, index));

  return (
    <>
      <div className={styles.heatmapBody}>
        <div className={styles.heatmapWrap}>
          <div className={styles.weekdayLabels} aria-hidden="true">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className={styles.heatmap}>
            {days.map((date) => {
              const key = toDateKey(date);
              const count = counts.get(key) ?? 0;
              const future = date.getTime() > today.getTime();
              return (
                <span
                  key={key}
                  className={`${styles.cell} ${styles[`level${heatLevel(count)}`] ?? ''} ${
                    future ? styles.future : ''
                  }`}
                  title={`${key} · 复习 ${count} 次`}
                />
              );
            })}
          </div>
        </div>
        <div className={styles.heatmapSummary}>
          <div>
            <strong>{logs.length}</strong>
            <span>累计复习</span>
          </div>
          <div>
            <strong>{counts.size}</strong>
            <span>有记录天数</span>
          </div>
        </div>
      </div>
      <div className={styles.legend} aria-hidden="true">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`${styles.cell} ${styles.legendCell} ${styles[`level${level}`] ?? ''}`}
          />
        ))}
        <span>多</span>
      </div>
    </>
  );
}

function WeekBars({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  const today = startOfDay(new Date());
  const days = lastNDays(7);

  return (
    <div className={styles.weekChart}>
      {days.map((key, index) => {
        const count = counts[index] ?? 0;
        const height = count === 0 ? 3 : 8 + (count / max) * 68;
        const weekday = WEEKDAY_LABELS[(new Date(`${key}T00:00:00`).getDay() + 6) % 7] ?? '';
        const isToday = key === toDateKey(today);

        return (
          <div key={key} className={styles.weekColumn} title={`${key} · 复习 ${count} 次`}>
            <span className={styles.weekValue}>{count > 0 ? count : ''}</span>
            <div className={styles.weekTrack}>
              <span
                className={`${styles.weekBar} ${count === 0 ? styles.weekBarEmpty : ''} ${
                  isToday ? styles.weekBarToday : ''
                }`}
                style={{ height }}
              />
            </div>
            <span className={`${styles.weekLabel} ${isToday ? styles.weekLabelToday : ''}`}>
              {weekday}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function WeakNodes({ nodes }: { nodes: SyllabusNode[] }) {
  const leafNodes = nodes.filter((node) => !nodes.some((child) => child.parentId === node.id));
  const candidates = leafNodes.length > 0 ? leafNodes : nodes;
  const weakNodes = getWeakNodes(candidates, 5);

  if (weakNodes.length === 0) {
    return (
      <EmptyState
        compact
        icon={<LayersIcon size={22} />}
        title="还没有考点"
        description="录入考点后，这里会列出最需要补的单元。"
        action={
          <Link to="/syllabus" className={common.link}>
            去添加考点
          </Link>
        }
      />
    );
  }

  return (
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
  );
}

export default function InsightsPage() {
  const { exam, loading } = useActiveExam();
  const nodes = useNodes(exam?.id ?? null);
  const logs = useReviewLogs(exam?.id ?? null);

  if (loading || nodes === undefined || logs === undefined) {
    return <PageSkeleton />;
  }

  if (!exam) {
    return (
      <div className={common.pageStack}>
        <PageHeader
          eyebrow="复盘"
          title="复盘"
          description="看清掌握度、复习节奏和真正拖后腿的考点。"
        />
        <EmptyState
          icon={<ChartIcon size={22} />}
          title="还没有考试"
          description="创建考试并开始复习后，这里会出现你的热力图和上岸指数。"
          action={
            <Link to="/" className={common.link}>
              回到今日创建考试
            </Link>
          }
        />
      </div>
    );
  }

  const readiness = computeReadiness(nodes);
  const coverage = computeCoverage(nodes);
  const streak = computeStreak(logs);
  const totalReviews = logs.length;
  const goodReviews = logs.filter((log) => log.rating >= 3).length;
  const accuracy = totalReviews > 0 ? Math.round((goodReviews / totalReviews) * 100) : 0;
  const weekDays = lastNDays(7);
  const weekCounts = weekDays.map(
    (key) => logs.filter((log) => toDateKey(new Date(log.reviewedAt)) === key).length,
  );
  const weekTotal = weekCounts.reduce((sum, count) => sum + count, 0);
  const nodeCount = nodes.length;
  const bucketDefs = [
    { label: '0–25%', min: 0, max: 25, tone: 'danger' },
    { label: '25–50%', min: 25, max: 50, tone: 'warning' },
    { label: '50–75%', min: 50, max: 75, tone: 'accent' },
    { label: '75–100%', min: 75, max: 101, tone: 'success' },
  ] as const;
  const buckets = bucketDefs.map((bucket) => {
    const count = nodes.filter((node) => {
      const percent = Math.round(node.mastery * 100);
      return percent >= bucket.min && percent < bucket.max;
    }).length;
    return { ...bucket, count };
  });

  return (
    <div className={common.pageStack}>
      <PageHeader
        eyebrow="数据与节奏"
        title="复盘"
        description={`已覆盖 ${coverage.covered} / ${coverage.total} 个考点，数据只来自你的本地复习记录。`}
      />

      <div className={styles.stats4}>
        <div className={common.stat}>
          <div className={common.statValue}>{Math.round(readiness * 100)}%</div>
          <div className={common.statLabel}>上岸指数</div>
        </div>
        <div className={common.stat}>
          <div className={common.statValue}>{totalReviews}</div>
          <div className={common.statLabel}>累计复习</div>
        </div>
        <div className={common.stat}>
          <div className={common.statValue}>{streak}</div>
          <div className={common.statLabel}>连续复习天数</div>
        </div>
        <div className={common.stat}>
          <div className={common.statValue}>{accuracy}%</div>
          <div className={common.statLabel}>记得率</div>
        </div>
      </div>

      {totalReviews === 0 ? (
        <div className={styles.hintBanner}>
          <StarIcon size={15} />
          <span>完成第一轮复习后，热力图、记得率和薄弱点会更有参考价值。</span>
        </div>
      ) : null}

      <div className={styles.analyticsGrid}>
        <div className={styles.column}>
          <section className={common.card}>
            <div className={common.cardPad}>
              <div className={common.sectionHead}>
                <div>
                  <h2 className={common.sectionTitle}>复习热力图</h2>
                  <p className={common.sectionHint}>近 12 周 · 共 {totalReviews} 次复习</p>
                </div>
                <Badge tone="accent">{streak} 天连续</Badge>
              </div>
              <ReviewHeatmap logs={logs} />
            </div>
          </section>

          <section className={common.card}>
            <div className={common.cardPad}>
              <div className={common.sectionHead}>
                <div>
                  <h2 className={common.sectionTitle}>本周节奏</h2>
                  <p className={common.sectionHint}>共复习 {weekTotal} 次</p>
                </div>
                <Badge>{nodeCount} 个考点</Badge>
              </div>
              <WeekBars counts={weekCounts} />
            </div>
          </section>
        </div>

        <div className={styles.column}>
          <section className={common.card}>
            <div className={common.cardPad}>
              <div className={common.sectionHead}>
                <div>
                  <h2 className={common.sectionTitle}>薄弱考点</h2>
                  <p className={common.sectionHint}>按掌握度和权重排序</p>
                </div>
                <Link to="/syllabus" className={common.link}>
                  全部考点
                </Link>
              </div>
              <WeakNodes nodes={nodes} />
            </div>
          </section>

          <section className={common.card}>
            <div className={common.cardPad}>
              <div className={common.sectionHead}>
                <div>
                  <h2 className={common.sectionTitle}>掌握度分布</h2>
                  <p className={common.sectionHint}>共 {nodeCount} 个考点</p>
                </div>
              </div>
              {nodeCount === 0 ? (
                <EmptyState
                  compact
                  icon={<ChartIcon size={22} />}
                  title="还没有掌握度数据"
                  description="录入考点并开始复习后，这里会显示分布。"
                />
              ) : (
                <div className={styles.distribution}>
                  {buckets.map((bucket) => {
                    const percent = nodeCount > 0 ? (bucket.count / nodeCount) * 100 : 0;
                    return (
                      <div key={bucket.label} className={styles.distRow}>
                        <span className={styles.distLabel}>{bucket.label}</span>
                        <div className={styles.distTrack}>
                          <span
                            className={`${styles.distFill} ${FILL_CLASS[bucket.tone] ?? ''}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className={styles.distCount}>{bucket.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
