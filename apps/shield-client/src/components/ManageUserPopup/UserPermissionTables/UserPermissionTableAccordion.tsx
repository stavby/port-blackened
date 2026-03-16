import TablesIcon from "@assets/icons/TablesIcon";
import StyledTooltipShield from "@components/Tooltip";
import { formatNonDirectSources, getNonDirectSources } from "@helpers/permissionSources";
import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  accordionClasses,
  AccordionDetails,
  AccordionSummary,
  accordionSummaryClasses,
  Box,
  Chip,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { PencilSimple } from "@phosphor-icons/react";
import { ObjectIdBrand } from "@port/shield-schemas";
import { UserPermissionTable, UserRowFilter, UserRowFilterValue } from "@types";
import { useMemo, useState } from "react";
import OverflowChipList, { ChipItem } from "../OverflowChipList";
import { SelectedRowFilter, UserPermissionTablesProps } from "./UserPermissionTables";

interface RowFilterDisplayProps {
  permissionTableId: ObjectIdBrand;
  rowFilter: UserRowFilter;
  handleOpenEditPopup: (selectedRowFilter: SelectedRowFilter) => void;
  handleDeleteRowFilterValue: (rowFilterValue: UserRowFilterValue["value"]) => void;
  disableEdit?: boolean;
}

const RowFilterDisplay = ({
  permissionTableId,
  rowFilter,
  handleOpenEditPopup,
  handleDeleteRowFilterValue,
  disableEdit,
}: RowFilterDisplayProps) => {
  const rowFiltersChips = useMemo<ChipItem[]>(() => {
    const chips = rowFilter.values.map(({ value, display_name, sources }) => {
      const nonDirectSources = getNonDirectSources(sources);

      return {
        id: value,
        label: display_name,
        disabled: disableEdit || nonDirectSources.length > 0,
        extraInfo: formatNonDirectSources(nonDirectSources),
      };
    });

    return chips.sort((a, b) => Number(a.disabled) - Number(b.disabled));
  }, [disableEdit, rowFilter.values]);

  return (
    <Grid container alignItems="center">
      <Grid item xs={11.5}>
        <Box sx={{ my: 1.5, ml: 1 }}>
          <OverflowChipList
            chips={rowFiltersChips}
            titleProps={{ itemSize: 3, text: rowFilter.display_name }}
            {...(rowFilter.type === "boolean" ? {} : { handleChipDelete: handleDeleteRowFilterValue })}
          />
        </Box>
      </Grid>
      <Grid item xs={0.5}>
        <IconButton
          sx={{ outlineColor: "primary.main" }}
          color="primary"
          size="small"
          disabled={disableEdit}
          onClick={() => handleOpenEditPopup({ permissionTableId, data: rowFilter })}
        >
          <PencilSimple size={16} />
        </IconButton>
      </Grid>
    </Grid>
  );
};

interface UserPermissionTableAccordionProps {
  isFirst: boolean;
  permissionTable: UserPermissionTable;
  handleOpenPopupRowFilterPopup: (rowFilter: SelectedRowFilter) => void;
  handleDeleteRowFilterValue: UserPermissionTablesProps["handleDeleteRowFilterValue"];
  disableEdit?: boolean;
}

const UserPermissionTableAccordion = ({
  isFirst,
  permissionTable,
  handleOpenPopupRowFilterPopup,
  handleDeleteRowFilterValue,
  disableEdit,
}: UserPermissionTableAccordionProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean | null>(null);
  const accordionSx = isFirst
    ? {
        [`&.${accordionClasses.root}`]: {
          boxShadow: "none !important",
        },
        [`&.${accordionClasses.root}:before`]: {
          display: "none !important",
        },
      }
    : {};

  return (
    <Accordion
      key={permissionTable.id}
      disableGutters
      sx={{ ...accordionSx, backgroundColor: "#f2f3fc" }}
      elevation={0}
      expanded={isExpanded === true || (isExpanded === null && isFirst)}
      onChange={(_, expanded) => setIsExpanded(expanded)}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          fontSize: 18,
          minHeight: "60px",
          maxHeight: "60px",
          direction: "rtl",
          borderBottom: "none !important",
          p: 0,
          fontWeight: 500,
          [`& .${accordionSummaryClasses.expandIconWrapper}`]: { transform: "rotate(90deg)" },
          [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: { transform: "rotate(0deg)" },
          [`& .${accordionSummaryClasses.content}`]: {
            my: 0,
            justifyContent: "flex-end",
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={0.5}>
          <StyledTooltipShield title="מפתח הרשאתי" placement="top" arrow>
            <Chip
              label={permissionTable.permission_keys[0]?.display_name ?? permissionTable.permission_keys[0]?.name}
              variant="outlined"
              sx={{ fontSize: 12 }}
              size="small"
            ></Chip>
          </StyledTooltipShield>
          <Typography variant="subtitle1" fontSize={18}>
            {permissionTable.display_name}
          </Typography>
          <TablesIcon />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {permissionTable.row_filters.map((rowFilter) => (
          <RowFilterDisplay
            key={rowFilter.kod}
            permissionTableId={permissionTable.id}
            rowFilter={rowFilter}
            handleOpenEditPopup={handleOpenPopupRowFilterPopup}
            handleDeleteRowFilterValue={(rowFilterValue) => handleDeleteRowFilterValue(permissionTable.id, rowFilter.kod, [rowFilterValue])}
            disableEdit={disableEdit}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

export default UserPermissionTableAccordion;
