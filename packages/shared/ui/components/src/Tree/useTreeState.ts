import { useCallback, useMemo, useState } from "react";
import { type TreeGraph, type FlatTreeNode, filterTreeNodesRecursive, flattenTree, TreeNode } from "./treeUtils";

export interface UseTreeStateOptions<T, K extends string | number | symbol> {
  graph: TreeGraph<T, K>;
  rootId: K;
  /** Filter function that receives search value and node */
  isMatch?: (search: string, node: TreeNode<T, K>) => boolean;

  onSearchValueChange?: (value: string) => void;
  defaultExpandedIds?: Set<K>;
  expandedIds?: Set<K>;
  onExpandedIdsChange?: (ids: Set<K>) => void;
  checkedIds?: Set<K>;
  onCheckedIdsChange?: (ids: Set<K>) => void;
  multiple?: boolean;
}

export interface UseTreeStateReturn<T, K extends string | number | symbol> {
  flatNodes: FlatTreeNode<T, K>[];
  expandedIds: Set<K>;
  checkedIds: Set<K>;
  matchingIds: Set<K>;
  searchValue: string;
  setSearchValue: (value: string) => void;
  toggleExpanded: (id: K) => void;
  toggleSelected: (id: K) => void;
  toggleChecked: (id: K) => void;
  expandAll: () => void;
  collapseAll: () => void;
  checkAll: () => void;
  uncheckAll: () => void;
}

export function useTreeState<T, K extends string | number | symbol>({
  graph,
  rootId,
  isMatch,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds,
  onExpandedIdsChange,
  checkedIds: controlledCheckedIds,
  onCheckedIdsChange,
  multiple = false,
}: UseTreeStateOptions<T, K>): UseTreeStateReturn<T, K> {
  const graphIds = useMemo(() => new Set(Object.values<TreeNode<T, K>>(graph).map(({ id }) => id)), [graph]);

  const [visibleIds, setVisibleIds] = useState<Set<K>>(new Set(graphIds));
  const [matchingIds, setMatchingIds] = useState<Set<K>>(new Set(graphIds));
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<K>>(new Set(defaultExpandedIds));
  const [internalCheckedIds, setInternalCheckedIds] = useState<Set<K>>(new Set());
  const [searchValue, updateSearchValue] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<K>>(new Set());

  const expandedIds = controlledExpandedIds ?? internalExpandedIds;
  const checkedIds = controlledCheckedIds ?? internalCheckedIds;

  const updateCheckedIds = useCallback(
    (nextIds: Set<K>) => {
      if (onCheckedIdsChange) {
        onCheckedIdsChange(nextIds);
      } else {
        setInternalCheckedIds(nextIds);
      }
    },
    [onCheckedIdsChange],
  );

  const updateExpandedIds = useCallback(
    (nextIds: Set<K>) => {
      if (onExpandedIdsChange) {
        onExpandedIdsChange(nextIds);
      } else {
        setInternalExpandedIds(nextIds);
      }
    },
    [onExpandedIdsChange],
  );

  const flatNodes = useMemo(() => {
    const rootNode = graph[rootId];

    return (
      rootNode?.children?.flatMap((childId) =>
        flattenTree(graph, childId, 0, { matchingIds, expandedIds, checkedIds, selectedIds, visibleIds }),
      ) ?? []
    );
  }, [graph, rootId, visibleIds, matchingIds, expandedIds, checkedIds, selectedIds]);

  const handleSetSearchValue = useCallback(
    (value: string) => {
      updateSearchValue(value);
      if (value && isMatch) {
        // Auto-expand all matching nodes when searching
        const matching = new Set<K>();
        const visible = new Set<K>();
        const expanded = new Set<K>();
        const rootNode = graph[rootId];

        rootNode?.children?.forEach((childId) => {
          filterTreeNodesRecursive(graph, childId, (node) => isMatch(value, node), false, {
            matchingIds: matching,
            visibleIds: visible,
            expandedIds: expanded,
          });
        });

        updateExpandedIds(expanded);
        setMatchingIds(matching);
        setVisibleIds(visible);
      } else {
        // Collapse all when clearing search
        updateExpandedIds(new Set(defaultExpandedIds));
        setMatchingIds(new Set());
        setVisibleIds(graphIds);
      }
    },
    [updateSearchValue, isMatch, graph, rootId, updateExpandedIds, defaultExpandedIds, graphIds, setVisibleIds],
  );

  const toggleExpanded = useCallback(
    (id: K) => {
      const next = new Set(expandedIds);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      updateExpandedIds(next);
    },
    [expandedIds, updateExpandedIds],
  );

  const toggleChecked = useCallback(
    (id: K) => {
      const next = new Set(checkedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      updateCheckedIds(next);
    },
    [checkedIds, updateCheckedIds],
  );

  const toggleSelected = useCallback(
    (id: K) => {
      const next = new Set<K>(multiple ? selectedIds : undefined);

      if (selectedIds.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      setSelectedIds(next);
    },
    [multiple, selectedIds, setSelectedIds],
  );

  const expandAll = useCallback(() => {
    updateExpandedIds(graphIds);
  }, [graphIds, updateExpandedIds]);

  const collapseAll = useCallback(() => {
    updateExpandedIds(new Set());
  }, [updateExpandedIds]);

  const checkAll = useCallback(() => {
    updateCheckedIds(matchingIds);
  }, [matchingIds, updateCheckedIds]);

  const uncheckAll = useCallback(() => {
    updateCheckedIds(new Set());
  }, [updateCheckedIds]);

  return {
    flatNodes,
    expandedIds,
    checkedIds,
    matchingIds,
    searchValue,
    setSearchValue: handleSetSearchValue,
    toggleExpanded,
    toggleChecked,
    toggleSelected,
    expandAll,
    collapseAll,
    checkAll,
    uncheckAll,
  };
}
