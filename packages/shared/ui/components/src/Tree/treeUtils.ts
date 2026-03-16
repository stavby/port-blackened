/**
 * Generic tree utilities for working with hierarchical data structures
 */

export type TreeNode<T, K extends string | number | symbol> = T & {
  id: K;
  children?: K[];
};

export type TreeGraph<T, K extends string | number | symbol> = Record<K, TreeNode<T, K>>;

export type FlatTreeNode<T, K extends string | number | symbol> = TreeNode<T, K> & {
  level: number;
  isMatching: boolean;
  isExpanded: boolean;
  isFolder: boolean;
  isChecked: boolean;
  isSelected: boolean;
};

/**
 * Filter tree nodes based on a predicate function, keeping parent nodes
 * if any of their descendants match (recursive)
 */
export function filterTreeNodesRecursive<T, K extends string | number | symbol>(
  graph: TreeGraph<T, K>,
  nodeId: K,
  predicate: (node: TreeNode<T, K>) => boolean,
  isParentMatching: boolean = false,
  {
    matchingIds = new Set(),
    visibleIds = new Set(),
    expandedIds = new Set(),
  }: { matchingIds: Set<K>; visibleIds: Set<K>; expandedIds: Set<K> },
): boolean {
  const node = graph[nodeId];
  if (!node) return false;

  const isCurrentMatching = predicate(node);

  const areChildrenMatching = !!node.children?.filter((childId) =>
    filterTreeNodesRecursive(graph, childId, predicate, isCurrentMatching || isParentMatching, {
      matchingIds,
      visibleIds,
      expandedIds,
    }),
  ).length;

  const isMatching = isCurrentMatching || areChildrenMatching;

  if (isMatching) {
    matchingIds.add(nodeId);
  }

  if (isMatching || isParentMatching) {
    visibleIds.add(nodeId);
  }

  if (areChildrenMatching) {
    expandedIds.add(nodeId);
  }

  return isMatching;
}

/**
 * Flatten a tree graph into a linear array for rendering, respecting
 * expanded/collapsed state (recursive)
 */
export function flattenTree<T, K extends string | number | symbol>(
  graph: TreeGraph<T, K>,
  nodeId: K,
  level: number = 0,
  {
    matchingIds,
    expandedIds,
    checkedIds,
    selectedIds,
    visibleIds,
  }: { matchingIds: Set<K>; expandedIds: Set<K>; checkedIds: Set<K>; selectedIds: Set<K>; visibleIds: Set<K> },
): FlatTreeNode<T, K>[] {
  const node = graph[nodeId];

  if (!node || !visibleIds.has(nodeId)) return [];

  const visibleChildren = node.children?.filter((childId) => visibleIds.has(childId)) ?? [];

  const flatNode: FlatTreeNode<T, K> = {
    ...node,
    level,
    isMatching: matchingIds.has(nodeId),
    isExpanded: expandedIds.has(nodeId),
    isChecked: checkedIds.has(nodeId),
    isSelected: selectedIds.has(nodeId),
    isFolder: visibleChildren.length > 0,
  };

  const result = [flatNode];

  // If expanded, recursively add children
  if (expandedIds.has(nodeId) && visibleChildren.length > 0) {
    visibleChildren.forEach((childId) => {
      result.push(...flattenTree(graph, childId, level + 1, { matchingIds, expandedIds, checkedIds, selectedIds, visibleIds }));
    });
  }

  return result;
}
