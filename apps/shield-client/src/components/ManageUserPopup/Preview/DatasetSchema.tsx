import { useGetLiveColumnsByTable } from "@api/users";
import TablePlus from "@assets/TablePlus";
import TrackPlus from "@assets/TrackPlus";
import { ShieldLogo } from "@assets/images/ShieldLogo";
import { DataGridProComponent } from "@components/DataGrid";
import AddIcon from "@mui/icons-material/Add";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  SxProps,
  Typography,
  accordionSummaryClasses,
} from "@mui/material";
import { GridColDef, gridClasses } from "@mui/x-data-grid-pro";
import { ColumnsDictPreviewDto, ObjectIdBrand, TablePreviewDto } from "@port/shield-schemas";
import { ReactNode, useMemo } from "react";
import { generateAccordionId, useAccordionState } from "./AccordionProvider";
import { BrowserApplication, GetUserPreviewWithId } from "./types";
import { SapLogo } from "@assets/images/SapLogo";
import { SapLogoOff } from "@assets/images/SapLogoOff";
import StyledTooltip from "@components/Tooltip";

type PermissionSource = "shield" | "sap-off" | "sap";

const PERMISSION_SOURCE_TOOLTIP_TITLES = {
  sap: "מקור הרשאה: SAP",
  shield: "מקור הרשאה: Shield",
  "sap-off": "מקור הרשאה כבוי: SAP",
} as const satisfies Record<PermissionSource, ReactNode>;

const calcPermissionSources = (permission_source: TablePreviewDto["permission_source"]) => {
  const permissionSources: PermissionSource[] = [];

  if (permission_source.source === "shield") {
    permissionSources.push("shield");
  }

  if (permission_source.prevSource === "sap" && permission_source.source !== "sap") {
    permissionSources.push("sap-off");
  }

  if (permission_source.source === "sap") {
    permissionSources.push("sap");
  }

  return permissionSources;
};

interface DatasetSchemaCommon {
  table: TablePreviewDto;
  userAttributes: GetUserPreviewWithId;
  expandData: { domain_id: ObjectIdBrand; browserApplication: BrowserApplication };
  addionalSx?: SxProps;
}

const DatasetSchema = (props: DatasetSchemaCommon) => {
  const permissionSources = calcPermissionSources(props.table.permission_source);
  const columns: GridColDef<ColumnsDictPreviewDto[string]>[] = useMemo(
    () => [
      {
        field: "column_name",
        headerName: "שם עמודה",
        flex: 1,
      },
      {
        field: "data_type",
        headerName: "סוג עמודה",
        flex: 0.5,
        valueGetter: ({ row }) => row.attributes.data_type,
      },
      {
        field: "classification",
        headerName: "מקור הרשאה",
        flex: 1,
        renderCell: (params) => {
          return (
            <Box display="flex" gap={1}>
              {permissionSources.includes("sap-off") && <SapLogoOff />}
              {permissionSources.includes("sap") && <SapLogo />}
              {permissionSources.includes("shield") && params.row.attributes.classification && !params.row.attributes.is_deleted && (
                <Chip
                  variant="outlined"
                  label={params.row.attributes.classification}
                  sx={{
                    padding: 0,
                    border: "1px solid #667085",
                    backgroundColor: "#F2F4F7",
                  }}
                />
              )}
            </Box>
          );
        },
      },
    ],
    [permissionSources],
  );

  const table = { tableSchema: props.table.schema_name, tableName: props.table.table_name };
  const { expandedMap, toggleAccordion } = useAccordionState();
  const accordionId = generateAccordionId([props.expandData.domain_id, props.expandData.browserApplication, table]);
  const isExpanded = !!expandedMap[accordionId];

  const { data, isError, isSuccess, isLoading } = useGetLiveColumnsByTable(props.userAttributes.userId, table, props.userAttributes, {
    enabled: isExpanded,
    meta: { loading: false, useDefaultOnError: false },
  });

  return (
    <Accordion
      disableGutters
      className="dataset-schema-accordion"
      sx={{ boxShadow: "none", ...props.addionalSx }}
      expanded={isExpanded}
      onChange={() => toggleAccordion(accordionId)}
    >
      <AccordionSummary
        sx={{
          [`& .${accordionSummaryClasses.content}`]: {
            justifyContent: "flex-end",
            my: 0,
          },
          [`& .${accordionSummaryClasses.expanded}`]: {
            fontWeight: 500,
          },
          [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
            transform: "none",
          },
          [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded} .arrow-left-icon`]: {
            transform: "rotate(-90deg)",
          },
        }}
        expandIcon={
          <Box display="flex" justifyContent="center" alignContent="center" gap={1}>
            <>
              <Box sx={{ width: "15px" }}>
                {isLoading ? <CircularProgress size={"15px"} sx={{ my: "auto" }} /> : <ArrowLeftIcon className="arrow-left-icon" />}
              </Box>
              <Box display={"flex"} height={"100%"} width={"20px"}>
                {props.table.haveNewColumns && !props.table.haveDeletedColumns ? (
                  <AddIcon sx={{ color: "green" }} />
                ) : !props.table.haveNewColumns && props.table.haveDeletedColumns ? (
                  <RemoveIcon sx={{ color: "red" }} />
                ) : props.table.haveNewColumns && props.table.haveDeletedColumns ? (
                  <ChangeHistoryIcon sx={{ color: "orange" }} />
                ) : null}
              </Box>
            </>
          </Box>
        }
      >
        <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"} width={"100%"}>
          <Box display={"flex"} justifyContent={"center"} alignItems={"center"}>
            <Box display={"flex"} alignItems={"center"}>
              {permissionSources.includes("shield") && (
                <StyledTooltip
                  title={
                    <Typography fontWeight={500} sx={{ direction: "ltr" }}>
                      {PERMISSION_SOURCE_TOOLTIP_TITLES["shield"]}
                    </Typography>
                  }
                >
                  <Box display="inline-flex" alignItems="flex-end">
                    <ShieldLogo withoutText={true} viewBox="10 -5 25 55" sx={{ m: 0, p: 0, width: 55, height: 40 }} />
                  </Box>
                </StyledTooltip>
              )}
              {permissionSources.includes("sap-off") && (
                <StyledTooltip
                  title={
                    <Typography fontWeight={500} sx={{ direction: "ltr" }}>
                      {PERMISSION_SOURCE_TOOLTIP_TITLES["sap-off"]}
                    </Typography>
                  }
                >
                  <Box display="inline-flex" alignItems="flex-end">
                    <SapLogoOff />
                  </Box>
                </StyledTooltip>
              )}
              {permissionSources.includes("sap") && (
                <StyledTooltip
                  title={
                    <Typography fontWeight={500} sx={{ direction: "ltr" }}>
                      {PERMISSION_SOURCE_TOOLTIP_TITLES["sap"]}
                    </Typography>
                  }
                >
                  <Box display="inline-flex" alignItems="flex-end">
                    <SapLogo />
                  </Box>
                </StyledTooltip>
              )}
            </Box>
          </Box>
          <Box display={"flex"} justifyContent={"center"} gap={1.5}>
            <Chip
              label={`${props.table.opaCount ?? 0}/${props.table.shieldCount}`}
              size="small"
              sx={{ backgroundColor: "#ebf0faff", color: "5f6368", borderRadius: "12px" }}
            ></Chip>
            <Typography textOverflow="ellipsis" fontWeight="inherit" sx={{ direction: "rtl" }} height="100%" textAlign="center">
              {props.table.table_display_name}
            </Typography>

            {props.table.application === "remix" ? (
              <TrackPlus width={"18px"} height={"18px"} />
            ) : (
              <TablePlus width={"18px"} height={"18px"} />
            )}
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        {isError && (
          <Box
            height="6em"
            display="flex"
            justifyContent="center"
            alignItems="center"
            alignContent={"center"}
            className="error-wrapper"
            textAlign="center"
          >
            <Alert sx={{ direction: "ltr", textAlign: "center", borderRadius: 3, "& .MuiAlert-icon": { p: 1 } }} severity="error">
              אוי לא! נראה שהייתה שגיאה בהשגת הסכמה
            </Alert>
          </Box>
        )}
        {isSuccess && (
          <Box
            display="flex"
            justifyContent={"center"}
            sx={{
              direction: "ltr",
              maxHeight: "300px",
              overflowY: "auto",
              ml: 12,
            }}
          >
            <DataGridProComponent
              hideFooter
              getRowClassName={(params) =>
                params.row.attributes?.is_new ? "row-color-addRow" : params.row.attributes?.is_deleted ? "row-color-deleteRow" : ""
              }
              sx={{
                "--DataGrid-overlayHeight": "400px",
                ".HideScrollbar::webkit-scrollbar": {
                  display: "none",
                },
                border: 0,
                "& .row-color-addRow": {
                  backgroundColor: "#90F28C5E",
                  "&:hover": {
                    backgroundColor: "#BFFFBC",
                    opacity: 0.8,
                  },
                },
                "& .row-color-deleteRow": {
                  backgroundColor: "#FFC1C1",
                  "&:hover": {
                    backgroundColor: "#FFC1C1",
                    opacity: 0.8,
                  },
                },
                [`& .${gridClasses.columnHeader}, & .${gridClasses.columnHeader}:focus`]: {
                  color: "blue",
                },
              }}
              getRowId={(row) => row.column_name}
              columns={columns}
              rows={Object.values(data || {})}
              loading={isLoading}
              slots={{
                noResultsOverlay: () => (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                    <Typography variant="h5">אין תוצאות</Typography>
                  </Box>
                ),
              }}
            />
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default DatasetSchema;
