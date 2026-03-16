import { highlightSearchedText } from "@helpers/highlightSearchedText";
import { ExpandMoreOutlined, KeyboardArrowLeftOutlined } from "@mui/icons-material";
import { Checkbox } from "@mui/material";
import { TreeItem } from "@mui/x-tree-view";
import { HierarchyNode } from "d3";
import { Dispatch, SetStateAction, SyntheticEvent } from "react";
import { StyledTreeView } from "./StyledTreeView";
import { CheckboxState } from "@helpers/useCheckboxState";

type TreeNodeItemValue = string | number;

export type TreeNodeItem = HierarchyNode<{
  value: TreeNodeItemValue;
  display_name: string;
  parent: string | null;
}>;

type TreeProps = {
  allNodes: TreeNodeItem;
  selectedNodes: Set<TreeNodeItemValue>;
  handleSelectedNodesChange: CheckboxState<TreeNodeItemValue>["handleCheckboxChange"];
  disabledOptions: Set<TreeNodeItemValue>;
  expandedTreeItemKeys: string[];
  setExpandedTreeItemKeys: Dispatch<SetStateAction<string[]>>;
  searchedValue: string;
};

export const Tree = ({
  allNodes,
  selectedNodes,
  handleSelectedNodesChange,
  disabledOptions,
  expandedTreeItemKeys,
  setExpandedTreeItemKeys,
  searchedValue,
}: TreeProps) => {
  const handleExpandedItemsChange = (_event: SyntheticEvent, itemIds: string[]) => {
    setExpandedTreeItemKeys(itemIds);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, nodes: TreeNodeItem, checked: boolean) => {
    handleSelectedNodesChange(nodes.data.value, checked);
    event.stopPropagation();
  };

  const renderTree = (nodes: TreeNodeItem) => (
    <TreeItem
      key={nodes.data.value}
      itemId={nodes.data.value.toString()}
      label={
        <>
          <Checkbox
            checked={
              // display all nodes
              selectedNodes.has(nodes.data.value) ||
              // display previous nodes as checked
              disabledOptions.has(nodes.data.value)
            }
            onChange={(e, checked) => {
              handleChange(e, nodes, checked);
            }}
            // disable previous selected nodes
            disabled={disabledOptions.has(nodes.data.value)}
            style={{ margin: 0 }}
          />
          {highlightSearchedText(nodes.data.display_name, searchedValue)}
        </>
      }
    >
      {nodes.children?.length ? nodes.children.map((node) => renderTree(node)) : null}
    </TreeItem>
  );

  return (
    <>
      {allNodes && allNodes.children?.length ? (
        <StyledTreeView
          slots={{ expandIcon: KeyboardArrowLeftOutlined, collapseIcon: ExpandMoreOutlined }}
          expandedItems={expandedTreeItemKeys}
          onExpandedItemsChange={handleExpandedItemsChange}
          sx={{ height: 500, overflow: "auto" }}
        >
          {renderTree(allNodes)}
        </StyledTreeView>
      ) : (
        <></>
      )}
    </>
  );
};
