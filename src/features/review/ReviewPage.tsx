/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/features/review/ReviewPage.tsx
 * @描述    复习会话：按到期队列逐张回忆、翻面、评分，并在结束后给出本轮复盘。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDueLabel, formatDuration } from '../../core/dates';
import { previewSchedule, RATING_HINTS, RATING_LABELS } from '../../core/scheduler';
import type { Rating, ReviewCard } from '../../core/types';
import { getDueCards, rateReview } from '../../data/repo';
import { useActiveExam, useNextDueAt } from '../../hooks/useExamQueries';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import {
  CheckCircleIcon,
  ClockIcon,
  CloseIcon,
  EyeIcon,
  NotebookIcon,
  RepeatIcon,
} from '../../ui/icons';
import { ProgressBar } from '../../ui/ProgressBar';
import { PageSkeleton } from '../../ui/Skeleton';
import { toast } from '../../ui/toast';
import common from '../../styles/common.module.css';
import styles from './ReviewPage.module.css';

const RATINGS: Rating[] = [1, 2, 3, 4];

type RatingCounts = Record<Rating, number>;

const EMPTY_RESULTS: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };

export default function ReviewPage() {
  const navigate = useNavigate();
  const { exam, loading } = useActiveExam();
  const nextDueAt = useNextDueAt(exam?.id ?? null);
  const examId = exam?.id ?? null;

  const [sessionCards, setSessionCards] = useState<ReviewCard[] | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<RatingCounts>(EMPTY_RESULTS);
  const [sessionReviews, setSessionReviews] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
  const [cardStartedAt, setCardStartedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!examId) {
      setSessionCards(null);
      setSessionLoading(false);
      return;
    }

    let active = true;
    setSessionLoading(true);

    getDueCards(examId)
      .then((cards) => {
        if (!active) {
          return;
        }
        setSessionCards(cards);
        setIndex(0);
        setRevealed(false);
        setResults(EMPTY_RESULTS);
        setSessionReviews(0);
        setSessionStartedAt(Date.now());
        setCardStartedAt(Date.now());
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        toast.error(error instanceof Error ? error.message : '无法读取复习队列');
        setSessionCards([]);
      })
      .finally(() => {
        if (active) {
          setSessionLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [examId]);

  const total = sessionCards?.length ?? 0;
  const isFinished = sessionCards !== null && index >= total;
  const currentCard = sessionCards && !isFinished ? (sessionCards[index] ?? null) : null;
  const preview = currentCard ? previewSchedule(currentCard.item) : null;
  const goodCount = results[3] + results[4];
  const accuracy = sessionReviews > 0 ? Math.round((goodCount / sessionReviews) * 100) : 0;

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!currentCard || !revealed || submitting) {
        return;
      }

      setSubmitting(true);
      try {
        await rateReview(currentCard.item.id, rating, Date.now() - cardStartedAt);
        setResults((current) => ({ ...current, [rating]: current[rating] + 1 }));
        setSessionReviews((current) => current + 1);
        setIndex((current) => current + 1);
        setRevealed(false);
        setCardStartedAt(Date.now());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '评分保存失败，请重试');
      } finally {
        setSubmitting(false);
      }
    },
    [cardStartedAt, currentCard, revealed, submitting],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFinished) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      ) {
        return;
      }

      if (!revealed) {
        if (event.code === 'Space' || event.key === 'Enter') {
          event.preventDefault();
          setRevealed(true);
        }
        return;
      }

      if (['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault();
        void handleRate(Number(event.key) as Rating);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRate, isFinished, revealed]);

  const restart = async () => {
    if (!examId) {
      return;
    }

    setSessionLoading(true);
    try {
      const cards = await getDueCards(examId);
      setSessionCards(cards);
      setIndex(0);
      setRevealed(false);
      setResults(EMPTY_RESULTS);
      setSessionReviews(0);
      setSessionStartedAt(Date.now());
      setCardStartedAt(Date.now());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '无法读取复习队列');
    } finally {
      setSessionLoading(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!exam) {
    return (
      <div className={styles.emptyWrap}>
        <EmptyState
          icon={<NotebookIcon size={22} />}
          title="还没有考试"
          description="创建考试并记下错题后，到期复习会出现在这里。"
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              回到今日创建考试
            </Button>
          }
        />
      </div>
    );
  }

  if (sessionLoading || sessionCards === null) {
    return <PageSkeleton />;
  }

  if (total === 0) {
    return (
      <div className={styles.emptyWrap}>
        <EmptyState
          icon={<ClockIcon size={22} />}
          title="今天没有到期的复习"
          description={
            nextDueAt
              ? `下一次复习在 ${formatDueLabel(nextDueAt)}。现在可以去整理错题，或者补一补薄弱考点。`
              : '先去错题本记一道错题，系统会自动安排复习。'
          }
          action={
            <div className={styles.emptyActions}>
              <Button variant="primary" onClick={() => navigate('/')}>
                回到今日
              </Button>
              <Button variant="secondary" onClick={() => navigate('/mistakes')}>
                去错题本
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className={styles.summary}>
        <div className={styles.summaryIcon}>
          <CheckCircleIcon size={30} />
        </div>
        <h1 className={styles.summaryTitle}>本轮复习完成</h1>
        <p className={styles.summaryText}>
          复习了 {sessionReviews} 条错题，用时 {formatDuration(Date.now() - sessionStartedAt)}。
        </p>

        <div className={common.statGrid}>
          <div className={common.stat}>
            <div className={common.statValue}>{sessionReviews}</div>
            <div className={common.statLabel}>本轮复习</div>
          </div>
          <div className={common.stat}>
            <div className={common.statValue}>{accuracy}%</div>
            <div className={common.statLabel}>记得或简单</div>
          </div>
          <div className={common.stat}>
            <div className={common.statValue}>{goodCount}</div>
            <div className={common.statLabel}>顺利回忆</div>
          </div>
        </div>

        <div className={styles.distribution}>
          {RATINGS.map((rating) => {
            const count = results[rating];
            const percent = sessionReviews > 0 ? (count / sessionReviews) * 100 : 0;
            return (
              <div key={rating} className={styles.distRow}>
                <span className={styles.distLabel}>{RATING_LABELS[rating]}</span>
                <div className={styles.distTrack}>
                  <span
                    className={`${styles.distFill} ${styles[`dist${rating}`] ?? ''}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className={styles.distCount}>{count}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.summaryActions}>
          <Button variant="primary" onClick={() => navigate('/')}>
            回到今日
          </Button>
          <Button variant="secondary" onClick={() => navigate('/insights')}>
            查看复盘
          </Button>
          <Button variant="ghost" onClick={() => void restart()}>
            再复习一轮
          </Button>
        </div>
      </div>
    );
  }

  if (!currentCard || !preview) {
    return <PageSkeleton />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topMeta}>
          <span className={styles.eyebrow}>今日复习</span>
          <span className={styles.progressText}>
            {index + 1} / {total}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<CloseIcon size={16} />}
          onClick={() => navigate('/')}
        >
          退出
        </Button>
      </header>

      <ProgressBar
        value={index / total}
        label={`复习进度 ${index} / ${total}`}
        className={styles.progressBar}
      />

      <article key={currentCard.item.id} className={styles.sessionCard}>
        <div className={styles.cardMeta}>
          <Badge tone="accent">{currentCard.node?.title ?? '未关联考点'}</Badge>
          {currentCard.mistake.source ? (
            <span className={styles.source}>{currentCard.mistake.source}</span>
          ) : null}
          <span className={styles.repCount}>第 {currentCard.item.reps + 1} 次复习</span>
        </div>

        <p className={styles.question}>{currentCard.mistake.content}</p>

        {currentCard.mistake.imageDataUrl ? (
          <img
            className={styles.questionImage}
            src={currentCard.mistake.imageDataUrl}
            alt="错题配图"
          />
        ) : null}

        {!revealed ? (
          <div className={styles.revealArea}>
            <Button
              variant="primary"
              size="lg"
              icon={<EyeIcon size={17} />}
              onClick={() => setRevealed(true)}
            >
              显示答案
            </Button>
            <span className={styles.keyHint}>按空格或回车显示答案</span>
          </div>
        ) : (
          <>
            <section className={styles.answerSection}>
              <span className={styles.sectionLabel}>答案</span>
              <p className={styles.answerText}>
                {currentCard.mistake.answer || '还没有填写答案，之后可以在错题本补充。'}
              </p>
            </section>

            {currentCard.mistake.analysis ? (
              <section className={styles.analysisSection}>
                <span className={styles.sectionLabel}>解析与易错点</span>
                <p className={styles.analysisText}>{currentCard.mistake.analysis}</p>
              </section>
            ) : null}

            <div className={styles.ratingGrid} role="group" aria-label="选择回忆程度">
              {RATINGS.map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`${styles.rating} ${styles[`rating${rating}`] ?? ''}`}
                  onClick={() => void handleRate(rating)}
                  disabled={submitting}
                  aria-label={`${RATING_LABELS[rating]}，下次 ${preview[rating]}后`}
                  aria-keyshortcuts={String(rating)}
                >
                  <strong>{RATING_LABELS[rating]}</strong>
                  <span>{preview[rating]}</span>
                  <em>{RATING_HINTS[rating]}</em>
                </button>
              ))}
            </div>
            <p className={styles.keyHint}>按 1–4 快速评分</p>
          </>
        )}
      </article>

      <div className={styles.sessionFoot}>
        <RepeatIcon size={14} />
        <span>评分会影响下一次复习时间和关联考点的掌握度</span>
      </div>
    </div>
  );
}
