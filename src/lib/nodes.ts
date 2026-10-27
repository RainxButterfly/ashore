/**
 * 版权所有 (c) 2026 星河一叶Roxy <ck_xuv@vip.qq.com>
 * SPDX-License-Identifier: Apache-2.0
 *
 * @文件    src/lib/nodes.ts
 * @描述    考点树工具：建树、扁平化、路径、后代集合与错题计数。
 * @作者    星河一叶Roxy
 * @邮箱    ck_xuv@vip.qq.com
 * @日期    2026-10-27
 */
import type { Mistake, SyllabusNode } from '../core/types';

export interface NodeTreeNode extends SyllabusNode {
  children: NodeTreeNode[];
}

export interface FlatNode {
  node: SyllabusNode;
  depth: number;
}

export function buildNodeTree(nodes: SyllabusNode[]): NodeTreeNode[] {
  const byId = new Map<string, NodeTreeNode>();
  nodes.forEach((node) => {
    byId.set(node.id, { ...node, children: [] });
  });

  const roots: NodeTreeNode[] = [];

  nodes.forEach((node) => {
    const current = byId.get(node.id);
    if (!current) {
      return;
    }

    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(current);
    } else {
      roots.push(current);
    }
  });

  const sortRecursive = (items: NodeTreeNode[]) => {
    items.sort((left, right) => left.order - right.order);
    items.forEach((item) => sortRecursive(item.children));
  };

  sortRecursive(roots);
  return roots;
}

export function flattenNodeTree(tree: NodeTreeNode[], depth = 0): FlatNode[] {
  const rows: FlatNode[] = [];

  tree.forEach((node) => {
    rows.push({ node, depth });
    if (node.children.length > 0) {
      rows.push(...flattenNodeTree(node.children, depth + 1));
    }
  });

  return rows;
}

export function flattenVisibleTree(
  tree: NodeTreeNode[],
  collapsed: Set<string>,
  depth = 0,
): FlatNode[] {
  const rows: FlatNode[] = [];

  tree.forEach((node) => {
    rows.push({ node, depth });
    if (node.children.length > 0 && !collapsed.has(node.id)) {
      rows.push(...flattenVisibleTree(node.children, collapsed, depth + 1));
    }
  });

  return rows;
}

export function getNodePath(nodes: SyllabusNode[], nodeId: string): string {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const parts: string[] = [];
  const seen = new Set<string>();
  let cursor = byId.get(nodeId);

  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    parts.push(cursor.title);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  return parts.reverse().join(' / ');
}

export function collectDescendantIds(nodes: SyllabusNode[], nodeId: string): Set<string> {
  const childrenByParent = new Map<string, SyllabusNode[]>();

  nodes.forEach((node) => {
    if (!node.parentId) {
      return;
    }
    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  });

  const result = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }
    childrenByParent.get(current)?.forEach((child) => {
      if (!result.has(child.id)) {
        result.add(child.id);
        queue.push(child.id);
      }
    });
  }

  return result;
}

export function getNodeOptions(
  nodes: SyllabusNode[],
  excludedIds?: Set<string>,
): { value: string; label: string }[] {
  return flattenNodeTree(buildNodeTree(nodes))
    .filter(({ node }) => !excludedIds?.has(node.id))
    .map(({ node, depth }) => ({
      value: node.id,
      label: `${'· '.repeat(depth)}${node.title}`,
    }));
}

export function countMistakesByNode(mistakes: Mistake[]): Map<string, number> {
  const counts = new Map<string, number>();

  mistakes.forEach((mistake) => {
    if (!mistake.nodeId) {
      return;
    }
    counts.set(mistake.nodeId, (counts.get(mistake.nodeId) ?? 0) + 1);
  });

  return counts;
}
