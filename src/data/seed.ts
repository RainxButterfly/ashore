/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/data/seed.ts
 * @描述    示例数据：一场考研、四个科目、若干错题与两周复习记录。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import { addDays, toDateKey } from '../core/dates';
import { createId } from '../core/id';
import type { Exam, Mistake, Rating, ReviewItem, ReviewLog, SyllabusNode } from '../core/types';
import { db } from './db';
import { SETTING_KEYS } from './repo';

interface SeedNode {
  title: string;
  weight: number;
  mastery: number;
  children?: SeedNode[];
}

interface SeedMistake {
  nodeTitle: string;
  content: string;
  answer: string;
  analysis: string;
  source: string;
  tags: string[];
  dueOffset: number;
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
}

const SYLLABUS: SeedNode[] = [
  {
    title: '数据结构',
    weight: 5,
    mastery: 0.5,
    children: [
      { title: '线性表', weight: 4, mastery: 0.72 },
      { title: '栈与队列', weight: 4, mastery: 0.58 },
      { title: '树与二叉树', weight: 5, mastery: 0.46 },
      { title: '图', weight: 5, mastery: 0.22 },
      { title: '查找', weight: 4, mastery: 0.64 },
      { title: '排序', weight: 5, mastery: 0.38 },
    ],
  },
  {
    title: '计算机组成原理',
    weight: 5,
    mastery: 0.41,
    children: [
      { title: '数据的表示', weight: 4, mastery: 0.55 },
      { title: '存储系统', weight: 5, mastery: 0.34 },
      { title: '指令系统', weight: 4, mastery: 0.62 },
      { title: 'CPU', weight: 5, mastery: 0.28 },
    ],
  },
  {
    title: '操作系统',
    weight: 4,
    mastery: 0.52,
    children: [
      { title: '进程与线程', weight: 5, mastery: 0.48 },
      { title: '内存管理', weight: 5, mastery: 0.31 },
      { title: '文件系统', weight: 4, mastery: 0.66 },
    ],
  },
  {
    title: '计算机网络',
    weight: 4,
    mastery: 0.44,
    children: [
      { title: '体系结构', weight: 3, mastery: 0.7 },
      { title: '传输层', weight: 5, mastery: 0.36 },
      { title: '网络层', weight: 4, mastery: 0.42 },
    ],
  },
];

const MISTAKES: SeedMistake[] = [
  {
    nodeTitle: '树与二叉树',
    content: '在含 n 个结点的二叉链表中，空指针域一共有多少个？',
    answer: 'n + 1 个。',
    analysis:
      '每个结点有左右两个指针域，共 2n 个。除根结点外，每个结点都被一条边指向，因此非空指针域是 n - 1 个，空指针域 = 2n - (n - 1) = n + 1。',
    source: '2024 真题 · 选择题',
    tags: ['树', '指针'],
    dueOffset: 0,
    ease: 2.4,
    intervalDays: 3,
    reps: 2,
    lapses: 0,
  },
  {
    nodeTitle: '图',
    content: 'Dijkstra 算法为什么不能处理带负权边的图？请举一个反例。',
    answer: '因为算法一旦把结点加入已确定集合，就不会再更新它；负权边可能让更短的路径在之后出现。',
    analysis:
      '反例：A→B 权重 1，A→C 权重 2，C→B 权重 -2。按 Dijkstra 先确定 B 的距离为 1，但实际最短路径 A→C→B 为 0。',
    source: '错题整理 · 图论',
    tags: ['图', '最短路'],
    dueOffset: 0,
    ease: 2.2,
    intervalDays: 2,
    reps: 1,
    lapses: 1,
  },
  {
    nodeTitle: '排序',
    content: '快速排序在什么情况下会退化到 O(n²)？如何规避？',
    answer: '当每次划分极不均衡时退化，例如已有序且固定选端点作为基准。',
    analysis:
      '规避方式：随机选择基准、三数取中、对小数组改用插入排序，或者使用三路划分处理大量重复元素。',
    source: '错题整理 · 排序',
    tags: ['排序', '复杂度'],
    dueOffset: 0,
    ease: 2.6,
    intervalDays: 5,
    reps: 3,
    lapses: 0,
  },
  {
    nodeTitle: '进程与线程',
    content: '进程与线程的区别，至少写出三点。',
    answer: '资源分配单位不同、切换开销不同、地址空间与通信方式不同。',
    analysis:
      '进程是资源分配的基本单位，线程是 CPU 调度的基本单位；同进程线程共享地址空间，通信更轻；线程切换通常比进程切换开销小，但一个线程崩溃可能影响整个进程。',
    source: '错题整理 · 操作系统',
    tags: ['进程', '线程'],
    dueOffset: 1,
    ease: 2.5,
    intervalDays: 4,
    reps: 2,
    lapses: 0,
  },
  {
    nodeTitle: '内存管理',
    content: 'LRU 页面置换算法的常见实现方式是什么？每次访问的开销是多少？',
    answer: '哈希表 + 双向链表，访问、插入和删除均为 O(1)。',
    analysis:
      '哈希表负责 O(1) 定位页面结点，双向链表维护最近使用顺序；访问时把结点移到表头，淘汰时删除表尾。',
    source: '错题整理 · 操作系统',
    tags: ['虚拟内存', 'LRU'],
    dueOffset: 3,
    ease: 2.3,
    intervalDays: 6,
    reps: 2,
    lapses: 1,
  },
  {
    nodeTitle: '传输层',
    content: 'TCP 三次握手中，第三次握手解决了什么问题？',
    answer: '让服务端确认客户端的接收能力，并避免历史连接请求浪费服务端资源。',
    analysis:
      '第三次握手使服务端确认客户端能收到自己的 SYN-ACK；同时客户端此时才建立连接，历史失效请求不会让服务端长时间保留半连接。',
    source: '2023 真题 · 简答题',
    tags: ['TCP', '握手'],
    dueOffset: 5,
    ease: 2.5,
    intervalDays: 7,
    reps: 3,
    lapses: 0,
  },
];

const LOG_COUNTS = [0, 0, 2, 1, 3, 2, 4, 3, 2, 5, 3, 2, 4, 2];
const LOG_RATINGS: Rating[] = [3, 4, 2, 3, 4, 3, 1, 3, 4, 3];

function dueAtForOffset(offset: number, now: Date): string {
  if (offset <= 0) {
    return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  }

  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 9, 0, 0).toISOString();
}

export async function seedSampleData(): Promise<string> {
  const now = new Date();
  const timestamp = now.toISOString();
  const examId = createId();
  const exam: Exam = {
    id: examId,
    name: '2027 考研 · 计算机',
    category: '考研',
    examDate: toDateKey(addDays(now, 53)),
    targetScore: 360,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const nodes: SyllabusNode[] = [];
  const nodeIdByTitle = new Map<string, string>();

  function walk(seedNodes: SeedNode[], parentId: string | null): void {
    seedNodes.forEach((seedNode, index) => {
      const id = createId();
      nodes.push({
        id,
        examId,
        parentId,
        title: seedNode.title,
        weight: seedNode.weight,
        mastery: seedNode.mastery,
        order: index,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      nodeIdByTitle.set(seedNode.title, id);

      if (seedNode.children) {
        walk(seedNode.children, id);
      }
    });
  }

  walk(SYLLABUS, null);

  const mistakes: Mistake[] = [];
  const reviewItems: ReviewItem[] = [];

  MISTAKES.forEach((seedMistake, index) => {
    const mistakeId = createId();
    const createdAt = new Date(now.getTime() - (index + 2) * 86_400_000).toISOString();
    mistakes.push({
      id: mistakeId,
      examId,
      nodeId: nodeIdByTitle.get(seedMistake.nodeTitle) ?? null,
      content: seedMistake.content,
      answer: seedMistake.answer,
      analysis: seedMistake.analysis,
      source: seedMistake.source,
      tags: seedMistake.tags,
      imageDataUrl: null,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    });

    reviewItems.push({
      id: createId(),
      examId,
      mistakeId,
      dueAt: dueAtForOffset(seedMistake.dueOffset, now),
      ease: seedMistake.ease,
      intervalDays: seedMistake.intervalDays,
      reps: seedMistake.reps,
      lapses: seedMistake.lapses,
      lastReviewedAt: new Date(now.getTime() - 2 * 86_400_000).toISOString(),
      createdAt,
    });
  });

  const reviewLogs: ReviewLog[] = [];
  let logCursor = 0;

  LOG_COUNTS.forEach((count, dayIndex) => {
    const offset = dayIndex - (LOG_COUNTS.length - 1);

    for (let index = 0; index < count; index += 1) {
      const item = reviewItems[logCursor % reviewItems.length];
      if (!item) {
        continue;
      }

      const reviewedAt =
        offset === 0
          ? new Date(now.getTime() - (index + 1) * 30 * 60 * 1000)
          : new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 20, 0, 0);

      reviewLogs.push({
        id: createId(),
        examId,
        itemId: item.id,
        mistakeId: item.mistakeId,
        rating: LOG_RATINGS[logCursor % LOG_RATINGS.length] ?? 3,
        reviewedAt: reviewedAt.toISOString(),
        elapsedMs: 24_000 + (logCursor % 7) * 6_000,
      });
      logCursor += 1;
    }
  });

  await db.transaction(
    'rw',
    [db.exams, db.nodes, db.mistakes, db.reviewItems, db.reviewLogs, db.settings],
    async () => {
      await db.exams.add(exam);
      await db.nodes.bulkAdd(nodes);
      await db.mistakes.bulkAdd(mistakes);
      await db.reviewItems.bulkAdd(reviewItems);
      if (reviewLogs.length > 0) {
        await db.reviewLogs.bulkAdd(reviewLogs);
      }
      await db.settings.put({ key: SETTING_KEYS.activeExamId, value: examId });
    },
  );

  return examId;
}
