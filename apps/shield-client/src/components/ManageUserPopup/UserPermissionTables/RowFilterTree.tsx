import { CheckboxState } from "@helpers/useCheckboxState";
import { useRowFilterOptions } from "@helpers/useRowFilterOptions";
import { KeyboardArrowLeft } from "@mui/icons-material";
import { Checkbox, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { TreeGraph, useTreeState } from "@port/components/tree";
import { useVirtualizer } from "@tanstack/react-virtual";
import { RowFilterFlatTreeValue, RowFilterValue, UserRowFilterValue } from "@types";
import { ForwardedRef, forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { AddAttributesPopupProps } from "./AddRowFiltersPopup";
import { highlightSearchedText } from "@helpers/highlightSearchedText";
import { hasNonDirectSources } from "@helpers/permissionSources";

export type RowFilterTreeRef = { onSearch: (value: string) => void };

interface RowFilterTreeProps
  extends Pick<AddAttributesPopupProps, "permissionTableId" | "rowFilterKod">,
    CheckboxState<RowFilterValue["value"]> {
  permissionTableId: string;
  rowFilterKod: string;
  initialRowFilterValuesMap: Map<UserRowFilterValue["value"], UserRowFilterValue>;
}

const RowFilterTree = forwardRef(
  (
    { permissionTableId, rowFilterKod, checkedValues, handleCheckboxChange, initialRowFilterValuesMap }: RowFilterTreeProps,
    ref: ForwardedRef<RowFilterTreeRef>,
  ) => {
    const ROOT_ID = "$root$";
    const { rowFilterValueOptions } = useRowFilterOptions<RowFilterFlatTreeValue>(permissionTableId, rowFilterKod);

    const graph = useMemo(() => {
      const result: TreeGraph<RowFilterValue & { disabled: boolean }, RowFilterValue["value"]> = {};

      rowFilterValueOptions?.forEach(({ value, display_name, parent }) => {
        const optionParent = parent ?? ROOT_ID;

        // parent might not exist before children
        if (optionParent in result) {
          result[optionParent]?.children?.push(value);
        } else {
          result[optionParent] = {
            id: optionParent,
            value: optionParent,
            display_name: "",
            children: [value],
            disabled: hasNonDirectSources(initialRowFilterValuesMap.get(optionParent)?.sources ?? []),
          };
        }

        const disabled = hasNonDirectSources(initialRowFilterValuesMap.get(value)?.sources ?? []);

        if (value in result) {
          // in case parent was initialized after we have to override the display name
          result[value]!.display_name = display_name;
          result[value]!.disabled = disabled;
        } else {
          result[value] = { id: value, value, display_name, disabled, children: [] };
        }
      });

      return result;
    }, [initialRowFilterValuesMap, rowFilterValueOptions]);

    const { flatNodes, toggleExpanded, toggleSelected, setSearchValue, searchValue } = useTreeState({
      rootId: ROOT_ID,
      graph,
      defaultExpandedIds: graph[ROOT_ID]?.children?.length === 1 ? new Set(graph[ROOT_ID].children) : undefined,
      checkedIds: checkedValues,
      isMatch: (search, node) => node.display_name.toLowerCase().includes(search.toLowerCase()),
    });

    useImperativeHandle(ref, () => ({ onSearch: setSearchValue }));

    const parentRef = useRef<HTMLDivElement | null>(null);
    const virtualizer = useVirtualizer({ count: flatNodes.length, getScrollElement: () => parentRef.current, estimateSize: () => 58 });

    return (
      <div ref={parentRef} style={{ height: "500px", overflowY: "auto" }}>
        <List style={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const node = flatNodes[virtualItem.index]!;

            return (
              <div
                key={node.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${virtualItem.start}px)` }}
              >
                <ListItemButton
                  sx={{ pl: node.level * 2 }}
                  onClick={() => {
                    toggleExpanded(node.id);
                    toggleSelected(node.id);
                  }}
                  selected={node.isSelected}
                >
                  <ListItemIcon sx={{ display: "flex", alignItems: "center", mx: 2 }}>
                    <KeyboardArrowLeft
                      sx={{
                        color: "text.primary",
                        transform: node.isExpanded ? "rotate(-90deg)" : "rotate(0deg)",
                        visibility: node.isFolder ? "visible" : "hidden",
                      }}
                    />
                    <Checkbox
                      onClick={(e) => e?.stopPropagation()}
                      onChange={(_, checked) => handleCheckboxChange(node.id, checked)}
                      checked={node.isChecked}
                      disabled={node.disabled}
                      edge="end"
                    />
                  </ListItemIcon>
                  <ListItemText>{highlightSearchedText(node.display_name, searchValue)}</ListItemText>
                </ListItemButton>
              </div>
            );
          })}
        </List>
      </div>
    );
  },
);

RowFilterTree.displayName = "RowFilterTree";

export default RowFilterTree;
