import { getTables, getTablesExcel } from "@api/tables";
import { ActionIcons, ClassificationPopup, DataGridProComponent, NoData, ScreenTitle, SearchField } from "@components";
import { VerifiedCheckmark } from "@components/Classification/VerifiedCheckmark";
import OverflowTooltip from "@components/OverflowTooltip";
import { StickyPageHeader } from "@components/StickyPageHeader";
import { default as StyledTooltipShield } from "@components/Tooltip";
import { ClassificationState } from "@constants/ClassificationState";
import { useDatagridPaginationProps } from "@helpers/useDatagridPaginationProps";
import { useGridExternalQuickFilter } from "@helpers/useExternalQuickFilter";
import { AddCircle } from "@mui/icons-material";
import { Avatar, Box, Button, Grid, Typography } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid-pro";
import { CheckCircle, Table, Warning } from "@phosphor-icons/react";
import SourceIcons from "@port/components/db-icons";
import { useSnackBarStore } from "@store/snackbarStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GetTablesDto } from "@types";
import { saveAs } from "file-saver";
import { ReactElement, useMemo, useState } from "react";
import SapSubtypeLogo from "../assets/images/sap_subtype_logo.svg";
import "../styles/classifyTables.css";

const classificationTools: { [key in ClassificationState]: { icon: ReactElement; tooltip: string } } = {
  [ClassificationState.UNCLASSIFIED]: { icon: <Warning weight="fill" size={24} color="#FC5367"></Warning>, tooltip: "לא מסווג" },
  [ClassificationState.PARTIALLY_CLASSIFIED]: { icon: <Warning weight="fill" size={24} color="#FC9453"></Warning>, tooltip: "מסווג חלקית" },
  [ClassificationState.CLASSIFIED]: { icon: <CheckCircle weight="fill" size={24} color="#19B4A7"></CheckCircle>, tooltip: "מסווג" },
  [ClassificationState.INTERNALLY_CLASSIFIED]: {
    icon: <CheckCircle weight="fill" size={24} color="#19B4A7"></CheckCircle>,
    tooltip: "מסווג פנימית",
  },
};

const ClassifyTables = () => {
  const { data: tables, isLoading } = useQuery<GetTablesDto[]>({
    queryKey: ["tables"],
    queryFn: getTables,
    meta: {
      loading: false,
    },
  });
  const [editedTable, setEditedTable] = useState<GetTablesDto | null>(null);
  const isClassificationPopupOpen = editedTable != null;
  const paginationProps = useDatagridPaginationProps();
  const { gridApiRef, handleSearch } = useGridExternalQuickFilter();
  const { setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));

  const columns = useMemo<GridColDef<GetTablesDto>[]>(
    () => [
      {
        field: "classificationState",
        headerName: "מצב סיווג",
        flex: 0.2,
        valueGetter: (params) => classificationTools[params.row.classificationState].tooltip,
        renderCell: (params) => {
          return (
            <Box>
              <StyledTooltipShield title={classificationTools[params.row.classificationState].tooltip} placement="left">
                {classificationTools[params.row.classificationState].icon}
              </StyledTooltipShield>
            </Box>
          );
        },
      },
      {
        field: "domain_display_name",
        headerName: "עולם תוכן",
        flex: 0.4,
      },
      {
        field: "source_type",
        headerName: "מערכת מקור",
        flex: 0.4,
        valueGetter: (params) => params.row.connection_display_name || params.row.source_type,
      },
      {
        field: "table_name",
        headerName: "שם טבלה",
        flex: 0.6,
        renderCell: (params) => (
          <Box display={"flex"} alignItems={"center"} gap={"10px"}>
            <StyledTooltipShield title={params.row.source_type} placement="right">
              <Box position={"relative"}>
                <Avatar src={SourceIcons[params.row.source_type]} alt="source_icon" sx={{ width: 36, height: 36 }} />
                {params.row.is_sap && (
                  <Avatar
                    src={SapSubtypeLogo}
                    alt="source_icon"
                    sx={{ width: 25, height: 25, position: "absolute", right: "-25%", bottom: "-20%" }}
                  />
                )}
              </Box>
            </StyledTooltipShield>
            <OverflowTooltip
              label={params.row.table_name}
              title={<Typography>{params.row.table_name}</Typography>}
              tooltipProps={{ placement: "left" }}
              labelProps={{
                sx: {
                  fontSize: "0.875rem",
                },
              }}
            />
            <VerifiedCheckmark table={params.row} />
          </Box>
        ),
      },
      {
        field: "table_display_name",
        headerName: "שם ידידותי לטבלה",
        flex: 0.5,
        renderCell: (params) => (
          <OverflowTooltip
            label={params.row.table_display_name}
            title={
              <Typography fontSize={"0.875rem"} sx={{ direction: "ltr" }}>
                {params.row.table_display_name}
              </Typography>
            }
            labelProps={{
              sx: {
                fontSize: "0.875rem",
              },
            }}
          />
        ),
      },
      {
        field: "table_desc",
        headerName: "תיאור טבלה",
        flex: 0.8,
        renderCell: (params) => (
          <OverflowTooltip
            label={params.row.table_desc}
            title={
              <Typography fontSize={"0.875rem"} sx={{ direction: "ltr" }}>
                {params.row.table_desc}
              </Typography>
            }
            labelProps={{
              sx: {
                fontSize: "0.875rem",
              },
            }}
          />
        ),
      },
      {
        field: "actions",
        headerName: "",
        sortable: false,
        filterable: false,
        hideable: false,
        disableColumnMenu: true,
        flex: 0.13,
        renderCell: (params) => {
          return <ActionIcons id={params.id} edit={() => setEditedTable(params.row)} />;
        },
      },
    ],
    [],
  );

  const useExportToExcelMutation = useMutation({
    mutationFn: async () => {
      const tablesExcelFile = await getTablesExcel();
      saveAs(tablesExcelFile, `סיווג_טבלאות.xlsb`);
    },
    onError: () => {
      setSnackbarError("שגיאה בעת טעינת אקסל");
    },
  });

  return (
    <>
      <Box>
        <StickyPageHeader>
          <ScreenTitle
            screenName="סיווג טבלאות"
            screenIcon={<Table color="#5f5858" fontSize={25} weight="thin" style={{ marginLeft: 5 }} />}
          />
          <Grid container justifyContent="space-between" columnSpacing={1} marginBottom="15px">
            <Grid item xs={9} textAlign="left">
              <SearchField handleSearch={handleSearch} />
            </Grid>

            <Grid item xs={1} textAlign="right">
              <Button variant="contained" color="primary" onClick={() => useExportToExcelMutation.mutate()}>
                <AddCircle />
                ייצוא לאקסל
              </Button>
            </Grid>
          </Grid>
        </StickyPageHeader>

        <DataGridProComponent
          className="tableSivug"
          columns={columns}
          rows={tables || []}
          autoHeight
          apiRef={gridApiRef}
          disableColumnSelector
          {...paginationProps}
          loading={isLoading}
          slots={{
            noRowsOverlay: () => <NoData mainText="לא נמצאו טבלאות" secondaryText="אולי כדאי לחפש משהו אחר :)" sx={{ mx: "auto" }} />,
            noResultsOverlay: () => <NoData mainText="לא נמצאו טבלאות" secondaryText="אולי כדאי לחפש משהו אחר :)" sx={{ mx: "auto" }} />,
          }}
          sx={{
            bgcolor: "white",
            "--DataGrid-overlayHeight": "400px",
          }}
        />
      </Box>
      {isClassificationPopupOpen && (
        <ClassificationPopup
          open={isClassificationPopupOpen}
          onClose={() => setEditedTable(null)}
          data={{
            table: {
              id: editedTable._id,
              displayName: editedTable.table_display_name,
              is_sap: editedTable.is_sap,
              source_type: editedTable.source_type,
              connection_display_name: editedTable.connection_display_name,
            },
            domain: {
              id: editedTable.domain_id,
              displayName: editedTable.domain_display_name,
            },
          }}
        />
      )}
    </>
  );
};

export default ClassifyTables;
