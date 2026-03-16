import { getDomainClassificationExposures } from "@api/domains";
import { editTable, getTableById, getTableSuggestionsById } from "@api/tables";
import PermissionKeyIcon from "@assets/PermissionKeyIcon";
import { CustomDatagridSelect, DataGridProComponent, DropDownCell, GeneralPopup, SearchField } from "@components";
import OverflowTip from "@components/OverflowTooltip";
import StyledTooltipShield from "@components/Tooltip/StyledTooltip";
import { ClassificationState, UNCLASSIFIED_VALUE } from "@constants/ClassificationState";
import { useLoadingContext } from "@contexts/Loading";
import { INTERNAL_RESOURCE_ID } from "@helpers/constants";
import { useGridExternalQuickFilter } from "@helpers/useExternalQuickFilter";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { gridClasses, GridColDef, GridRenderCellParams, GridRowId, GridRowModel, GridRowsProp, ValueOptions } from "@mui/x-data-grid-pro";
import { BoundingBox, Table } from "@phosphor-icons/react";
import SourceIcons from "@port/components/db-icons";
import { ObjectIdBrand, VerificationStage } from "@port/shield-schemas";
import { useSnackBarStore } from "@store/snackbarStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClassificationDBModel, ColumnAttributes, EditableColumnsDict, GetTablesDto, MaskType } from "@types";
import { useEffect, useMemo, useState } from "react";
import SapSubtypeLogo from "../../assets/images/sap_subtype_logo.svg";
import { TableClassificationActionButtons } from "./ActionsButtons";
import "./ClassificationPopup.css";
import { DataVerification } from "./DataVerification";
import { VerifiedCheckmark } from "./VerifiedCheckmark";

type TableRow = ColumnAttributes & {
  _id: string;
  column_name: string;
  isNew?: boolean;
  isClassificationSuggested: boolean;
};

type ClassificationOption = Extract<ValueOptions, { value: unknown }>;

type ClassificationPopupData = {
  table: {
    id: string;
    name?: string;
    displayName?: string;
    desc?: string;
    is_sap?: boolean;
    connection_display_name?: string;
    source_type: string;
  };
  domain: {
    id: string;
    name?: string;
    displayName?: string;
  };
};

type ClassificationPopupProps = {
  data: ClassificationPopupData;
  open: boolean;
  onClose: () => void;
  onSave?: (newColumnsDict: EditableColumnsDict) => void;
};

const maskingOptions: { value: MaskType; label: string; tooltip?: string }[] = [
  { value: "none", label: "ללא" },
  { value: "null", label: "כיכוב", tooltip: "הסתר תוכן עמודה" },
  { value: "hash", label: "גיבוב", tooltip: "המרה לערך בלתי קריא" },
];

const formatClassifications = (classifications: ClassificationDBModel[]): Record<string, ClassificationOption> => {
  return classifications.reduce(
    (acc, clsf) => {
      acc[clsf._id] = { value: clsf._id, label: clsf.name };

      return acc;
    },
    {} as Record<string, ClassificationOption>,
  );
};

const getClassificationState = (newColumnsDict: EditableColumnsDict): ClassificationState => {
  let fullClassified = true;
  let partiallyClassified = false;
  let internalClassification = false;

  Object.values(newColumnsDict).forEach((column) => {
    const classifiction = column.attributes.classification;

    if (classifiction) {
      if (classifiction === INTERNAL_RESOURCE_ID) {
        internalClassification = true;
      } else {
        partiallyClassified = true;
      }
    } else {
      fullClassified = false;
    }
  });

  if (internalClassification) {
    return ClassificationState.INTERNALLY_CLASSIFIED;
  } else if (fullClassified) {
    return ClassificationState.CLASSIFIED;
  } else if (partiallyClassified) {
    return ClassificationState.PARTIALLY_CLASSIFIED;
  }
  return ClassificationState.UNCLASSIFIED;
};

export function ClassificationPopup({ data, open, onClose, onSave }: ClassificationPopupProps) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<GridRowsProp<TableRow>>([]);
  const [selectedClassification, setSelectedClassification] = useState<string>("");
  const [selectedMask, setSelectedMask] = useState<MaskType>("");
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const { setSnackbarSuccess, setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));
  const [showAllSelectTooltip, setShowAllSelectTooltip] = useState({ classification: false, mask: false });
  const { gridApiRef, handleSearch } = useGridExternalQuickFilter();
  const [selectededRowsIds, setSelectedRowsIds] = useState<GridRowId[]>([]);

  const [verificationStages, setVerificationStages] = useState<VerificationStage[] | null>();

  const { data: domainClassificationExposures } = useQuery({
    queryKey: ["domains", "classification-exposures", data.domain.id],
    queryFn: ({ queryKey }) => getDomainClassificationExposures(queryKey[2]!),
    meta: {
      loading: false,
    },
  });
  const {
    data: tableData,
    isLoading: isLoadingTable,
    isError: isTableDataError,
  } = useQuery({
    queryKey: ["tables", data?.table.id],
    queryFn: ({ queryKey }) => getTableById(queryKey[1]!),
    meta: {
      loading: false,
    },
    enabled: !!data?.table.id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    placeholderData: undefined,
  });

  const {
    data: tableSuggestions,
    isLoading: isLoadingTableSuggestions,
    isError: isTableSuggestionsError,
  } = useQuery({
    queryKey: ["tableSuggestions", data?.table.id],
    queryFn: ({ queryKey }) => getTableSuggestionsById(queryKey[1]!),
    meta: {
      loading: false,
    },
    enabled: !!data?.table.id,
  });

  const { setLoading } = useLoadingContext();

  useEffect(() => {
    if (isTableDataError || isTableSuggestionsError) {
      setSnackbarError("שגיאה בעת טעינת הטבלה");
    }
  }, [isTableDataError, isTableSuggestionsError, setSnackbarError]);

  const formattedColumnDict: TableRow[] = useMemo(
    () =>
      tableData && tableSuggestions
        ? Object.values(tableData.table.columns_dict).map((column) => ({
            _id: column.column_name,
            column_name: column.column_name,
            data_type: column.attributes.data_type,
            data_type_hebrew: column.attributes.data_type_hebrew,
            column_display_name: column.attributes.column_display_name,
            column_desc: column.attributes.column_desc,
            classification: ((column.attributes.classification || tableSuggestions.column_classifications[column.column_name]) ??
              "") as ObjectIdBrand,
            mask: column.attributes.mask ?? "",
            isClassificationSuggested: !column.attributes.classification && column.column_name in tableSuggestions.column_classifications,
          }))
        : [],
    [tableData, tableSuggestions],
  );

  const classificationOptions = useMemo(
    () =>
      tableData
        ? {
            all: formatClassifications(tableData.classifications.all),
            user: formatClassifications(tableData.classifications.user),
          }
        : null,
    [tableData],
  );
  const permissionKeys = useMemo(
    () => (tableData ? Object.values(tableData.table.permission_keys).map((key) => key.toLowerCase()) : null),
    [tableData],
  );

  useEffect(() => {
    if (!tableData || !tableSuggestions) {
      return;
    }

    setRows(formattedColumnDict);
    setVerificationStages(tableData.table.verification_stages || null);
  }, [formattedColumnDict, tableData, tableSuggestions]);

  const processRowUpdate = async (newRow: GridRowModel<TableRow>) => {
    const updatedRow = { ...newRow, isNew: false };

    // Update the row in the table
    setRows(rows.map((row) => (row._id === newRow._id ? updatedRow : row)));

    return updatedRow;
  };

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: "column_display_name",
      headerName: "שם עמודה",
      flex: 2,
      editable: false,
      renderCell: (params) => (
        <OverflowTip
          title={<Typography variant="body2">{params.value}</Typography>}
          label={
            permissionKeys?.includes(params.row.column_name) ? (
              <Box display="flex" alignItems={"center"} gap={0.5}>
                <PermissionKeyIcon />
                {params.value}
              </Box>
            ) : (
              <>{params.value}</>
            )
          }
          labelProps={{
            variant: "body2",
          }}
        />
      ),
    },
    {
      field: "column_name",
      headerName: "שם עמודה טכני",
      flex: 2,
      editable: false,
      renderCell: (params) => (
        <OverflowTip
          title={<Typography variant="body2">{params.value}</Typography>}
          label={params.value}
          labelProps={{
            variant: "body2",
            sx: {
              direction: "rtl",
            },
          }}
        />
      ),
    },
    {
      field: "data_type_hebrew",
      headerName: "סוג עמודה",
      flex: 2,
      editable: false,
    },
    {
      field: "classification",
      headerName: "סיווג",
      flex: 3,
      renderCell: (params) => {
        const chip = classificationOptions?.all?.[params.row.classification ?? ""]?.label;
        const classificationExposure = params.row.classification
          ? (domainClassificationExposures?.classificationExposures[params.row.classification] ?? 0)
          : 0;

        return (
          <DropDownCell
            showDropDownArrow={
              hoveredRowId === params.row._id &&
              params.row.classification !== INTERNAL_RESOURCE_ID &&
              (!params.row.classification || !!classificationOptions?.user[params.row.classification])
            }
          >
            {chip && (
              <StyledTooltipShield
                placement="top"
                title={
                  params.row.classification !== INTERNAL_RESOURCE_ID && (
                    <Stack justifyContent="center" alignItems="center" p={1}>
                      <Typography sx={{ color: "text.primary", direction: "ltr" }} variant="h6" lineHeight={1.25}>
                        {`${classificationExposure === 1 ? "מורשה 1" : `${classificationExposure} מורשים`}`}
                      </Typography>
                      <Typography sx={{ color: "text.secondary", direction: "ltr" }}>לרמת סיווג זו</Typography>
                    </Stack>
                  )
                }
              >
                <Chip
                  label={chip}
                  variant="outlined"
                  disabled={
                    params.row.classification === INTERNAL_RESOURCE_ID ||
                    (!!params.row.classification && !classificationOptions?.user[params.row.classification])
                  }
                  sx={{
                    background: "#F2F4F7",
                    border: params.row.isClassificationSuggested ? "1px dashed #ffa528" : "1px solid #667085",
                  }}
                />
              </StyledTooltipShield>
            )}
          </DropDownCell>
        );
      },
      renderEditCell: (params) => {
        return (
          <CustomDatagridSelect
            selectProps={{
              fullWidth: true,
              defaultOpen: true,
              value: params.row.classification ?? "",
              onChange: (event) =>
                setRows((prevRows) =>
                  prevRows.map((row) =>
                    row._id === params.row._id
                      ? {
                          ...row,
                          classification: event.target.value as ObjectIdBrand,
                          isClassificationSuggested: row.isClassificationSuggested && row.classification === event.target.value,
                        }
                      : row,
                  ),
                ),
            }}
            gridProps={params}
          >
            {Object.values(classificationOptions?.all ?? {}).map((clsf) => (
              <MenuItem
                sx={{ justifyContent: "flex-end" }}
                key={clsf.value}
                value={clsf.value}
                disabled={!classificationOptions?.user[clsf.value]}
              >
                {clsf.label}
              </MenuItem>
            ))}
            <MenuItem value={""} sx={{ justifyContent: "flex-end" }}>
              ללא סיווג
            </MenuItem>
          </CustomDatagridSelect>
        );
      },
      valueFormatter: (params) => classificationOptions?.all?.[params.value ?? ""]?.label,
      editable: true,
    },
    {
      field: "mask",
      headerName: "סוג התממה",
      flex: 2,
      renderCell: (params: GridRenderCellParams) => {
        const text = maskingOptions?.find((opt) => opt?.value === params.row?.mask)?.label;
        return (
          <DropDownCell showDropDownArrow={hoveredRowId === params.row._id && params.row.classification !== INTERNAL_RESOURCE_ID}>
            {text}
          </DropDownCell>
        );
      },
      editable: true,
      type: "singleSelect",
      valueOptions: maskingOptions,
    },
  ];

  const applyMaskAndClassificationToSelected = () => {
    if (!selectedClassification && !selectedMask) return;

    const classificationToApply = (selectedClassification === UNCLASSIFIED_VALUE ? "" : selectedClassification) as ObjectIdBrand;

    const selectededRowsIdsSet = new Set(selectededRowsIds);

    setRows((prevState) =>
      prevState.map((row) => {
        if (selectededRowsIdsSet.has(row._id)) {
          const override = {
            mask: selectedMask || row.mask,
            classification:
              selectedClassification && gridApiRef.current.getCellParams(row._id, "classification").isEditable
                ? classificationToApply
                : row.classification,
          } satisfies Pick<TableRow, "classification" | "mask">;

          return { ...row, ...override };
        }

        return row;
      }),
    );
    setSelectedClassification("");
    setSelectedMask("");
    setSelectedRowsIds([]);
  };

  /** Revert classification in selected column to initial value*/
  const revertClassificationToSelected = () => {
    setSelectedClassification("");
    setRows((prevState) =>
      prevState.map((row) =>
        selectededRowsIds.includes(row._id)
          ? {
              ...row,
              classification: formattedColumnDict.find((r) => r._id === row._id)?.classification,
            }
          : row,
      ),
    );
  };

  /** Revert mask in selected column to initial value*/
  const revertMaskToSelected = () => {
    setSelectedMask("");
    setRows((prevState) =>
      prevState.map((row) =>
        selectededRowsIds.includes(row._id)
          ? {
              ...row,
              mask: formattedColumnDict.find((r) => r._id === row._id)?.mask,
            }
          : row,
      ),
    );
  };

  const formatRowsToColumnDict = (rows: readonly TableRow[]): EditableColumnsDict => {
    return rows.reduce<EditableColumnsDict>((columnsDict, row) => {
      columnsDict[row._id] = {
        column_name: row.column_name,
        attributes: {
          classification: row.classification || undefined,
          mask: row.mask || undefined,
        },
      };

      return columnsDict;
    }, {});
  };

  const handleSave = async () => {
    const newColumnsDict = formatRowsToColumnDict(rows);
    try {
      setLoading(true);

      await editTable(data.table.id, { columns_dict: newColumnsDict, verification_stages: verificationStages });
      setSnackbarSuccess("הטבלה עודכנה בהצלחה");

      queryClient.setQueryData(["tables"], (oldData: GetTablesDto[] | undefined) => {
        if (!oldData) {
          return;
        }

        return oldData.map((table: GetTablesDto) =>
          table._id === data.table.id
            ? {
                ...table,
                columns_dict: newColumnsDict,
                classificationState: getClassificationState(newColumnsDict),
                verification_stages: verificationStages,
              }
            : table,
        );
      });
      queryClient.invalidateQueries({ queryKey: ["tableSuggestions", data.table.id] });
      queryClient.invalidateQueries({ queryKey: ["tables", data.table.id] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });

      if (onSave) onSave(newColumnsDict);
    } catch {
      const errorMessage = "שגיאה בעת שמירת הטבלה";
      setSnackbarError(errorMessage);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const cleanCheckedBox = () => {
    setSelectedRowsIds([]);
  };

  const isColumnsLoading = isLoadingTable || isLoadingTableSuggestions;
  const noPermissionKeyExists = !isColumnsLoading && (!permissionKeys || permissionKeys.length === 0);

  return (
    <GeneralPopup
      open={open}
      onClose={onClose}
      title={""}
      titleIcon={
        <Stack direction="row" alignItems="center" spacing={2}>
          <Table
            color="#fff"
            fontSize={25}
            style={{
              padding: 2,
              borderRadius: 2,
              backgroundColor: "#3256DF",
            }}
          />
          <StyledTooltipShield
            title={tableData?.table?.is_sap ? <Typography sx={{ direction: "ltr" }}>על טבלה זו מוכלות הרשאות SAP</Typography> : undefined}
          >
            <Box position="relative">
              <Avatar src={SourceIcons[data?.table?.source_type]} alt="source_icon" sx={{ width: 36, height: 36 }} />
              {tableData?.table?.is_sap && (
                <Avatar
                  src={SapSubtypeLogo}
                  alt="source_icon"
                  sx={{ width: 25, height: 25, position: "absolute", right: "-25%", bottom: "-20%" }}
                />
              )}
            </Box>
          </StyledTooltipShield>
          <StyledTooltipShield
            arrow
            title={
              isColumnsLoading ? (
                <Box m={1}>
                  <CircularProgress size={30} thickness={5} />
                </Box>
              ) : (
                <>
                  {tableData?.table.source_type && (
                    <Typography sx={{ direction: "ltr" }} fontSize={13}>
                      <b>מקור הנתונים:</b> {tableData.table.source_type}
                    </Typography>
                  )}
                  {tableData?.table?.connection_display_name && (
                    <Typography sx={{ direction: "ltr" }} fontSize={13}>
                      <b>מערכת מקור:</b> {tableData.table.connection_display_name}
                    </Typography>
                  )}
                  <Typography sx={{ direction: "ltr" }} fontSize={13}>
                    <b>שם הטבלה במקור: </b>
                    {tableData?.table.table_name || ""}
                  </Typography>
                </>
              )
            }
            placement="left"
          >
            <Typography variant="h6">{data?.table.displayName}</Typography>
          </StyledTooltipShield>
          <VerifiedCheckmark table={{ ...tableData?.table, verification_stages: verificationStages || [] }} />
        </Stack>
      }
      dir="rtl"
      PaperProps={{ sx: { minWidth: "850px", height: "90vh" } }}
      actionsButtonsProps={{
        enable: true,
        slot: <TableClassificationActionButtons cleanCheckedBox={cleanCheckedBox} handleSave={handleSave} />,
      }}
    >
      <Typography sx={{ color: "primary.main", display: "flex", alignItems: "center", gap: 0.5 }}>
        <BoundingBox size={22} weight="thin" />
        {`${data?.domain.displayName} (${domainClassificationExposures?.domainExposure ?? 0} משתמשים)`}
      </Typography>
      {data.table.source_type === "remix" ? (
        <DataVerification verificationStages={verificationStages} setVerificationStages={setVerificationStages} />
      ) : (
        <></>
      )}
      <Stack sx={{ my: 3 }} direction={"column"} spacing={1.5}>
        <Grid container spacing={1} alignItems={"center"} justifyContent={"flex-start"}>
          <Grid item xs={4.2}>
            <FormControl>
              <InputLabel sx={{ fontSize: 15 }}>בחר סיווג לעמודות נבחרות</InputLabel>
              <StyledTooltipShield
                open={showAllSelectTooltip.classification}
                placement="left"
                title={"סמן עמודות והגדר עבורם סיווג"}
                onMouseEnter={() => setShowAllSelectTooltip((prev) => ({ ...prev, classification: true }))}
                onMouseLeave={() => setShowAllSelectTooltip((prev) => ({ ...prev, classification: false }))}
              >
                <Select
                  placeholder="רמת סיווג"
                  style={{ minWidth: 280, maxHeight: 45 }}
                  value={selectedClassification}
                  onChange={({ target: { value } }) => {
                    setSelectedClassification(value);
                  }}
                  onClick={() => setShowAllSelectTooltip((prev) => ({ ...prev, classification: false }))}
                  label="בחר מרשימת רמות הסיווג"
                >
                  {Object.values(classificationOptions?.user ?? {}).map((clsf) => (
                    <MenuItem sx={{ justifyContent: "flex-end" }} key={clsf.value} value={clsf.value}>
                      {clsf.label}
                    </MenuItem>
                  ))}
                  <MenuItem value={UNCLASSIFIED_VALUE} sx={{ justifyContent: "flex-end" }}>
                    ללא סיווג
                  </MenuItem>
                </Select>
              </StyledTooltipShield>
            </FormControl>
          </Grid>
          <Grid item xs={7.8}>
            {selectedClassification && selectededRowsIds.length > 0 && <Button onClick={revertClassificationToSelected}>נקה הכל</Button>}
          </Grid>
        </Grid>
        <Grid container spacing={1} alignItems={"flex-end"} justifyContent={"flex-start"}>
          <Grid item xs={4.2}>
            <FormControl>
              <InputLabel sx={{ fontSize: 15 }}>בחר סוג התממה לעמודות נבחרות</InputLabel>
              <StyledTooltipShield
                placement="left-start"
                title={"סמן עמודות והגדר עבורם התממה"}
                open={showAllSelectTooltip.mask}
                onMouseEnter={() => setShowAllSelectTooltip((prev) => ({ ...prev, mask: true }))}
                onMouseLeave={() => setShowAllSelectTooltip((prev) => ({ ...prev, mask: false }))}
              >
                <Select<MaskType>
                  placeholder="סוג התממה"
                  style={{ minWidth: 280, maxHeight: 45 }}
                  value={selectedMask}
                  onChange={(event) => {
                    const value = event.target.value as MaskType;
                    setSelectedMask(value);
                  }}
                  onClick={() => setShowAllSelectTooltip((prev) => ({ ...prev, mask: false }))}
                  label="בחר סוג התממה לעמודות נבחרות"
                >
                  {maskingOptions.map((mask) => (
                    <MenuItem sx={{ justifyContent: "flex-end" }} key={mask.value} value={mask.value}>
                      <StyledTooltipShield placement="left" title={mask.tooltip}>
                        <span>{mask.label}</span>
                      </StyledTooltipShield>
                    </MenuItem>
                  ))}
                </Select>
              </StyledTooltipShield>
            </FormControl>
          </Grid>
          <Grid item xs={5.5} alignSelf="center">
            {selectedMask && selectededRowsIds.length > 0 && <Button onClick={revertMaskToSelected}>נקה הכל</Button>}
          </Grid>
          <Grid item>
            <Button
              disabled={(selectedClassification === "" && selectedMask === "") || selectededRowsIds.length === 0}
              onClick={applyMaskAndClassificationToSelected}
              variant="contained"
              color="info"
            >
              החל סיווג והתממה
            </Button>
          </Grid>
        </Grid>
        <Grid item xs={12} textAlign="left">
          <Grid item xs={12}>
            <SearchField handleSearch={handleSearch} />
          </Grid>
        </Grid>
      </Stack>
      {noPermissionKeyExists && (
        <Alert severity="info" sx={{ my: 1 }}>
          לא הוגדר מפתח הרשאתי עבור הטבלה
        </Alert>
      )}
      {isColumnsLoading ? (
        <Box display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} my={5} height={"400px"}>
          <CircularProgress size={120} />
        </Box>
      ) : (
        <Box height={"450px"}>
          <DataGridProComponent
            onRowSelectionModelChange={setSelectedRowsIds}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectededRowsIds}
            disableColumnResize
            className="tableSivugHatmama"
            rows={rows}
            columns={columns}
            hideFooter
            isSingleClickEdit
            disableColumnSelector
            apiRef={gridApiRef}
            processRowUpdate={processRowUpdate}
            scrollbarSize={0}
            rowSelection
            slots={{
              noResultsOverlay: () => (
                <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                  <Typography variant="h5">אין תוצאות</Typography>
                </Box>
              ),
            }}
            slotProps={{
              row: {
                onMouseEnter: (event) => setHoveredRowId(event.currentTarget.dataset.id ?? null),
                onMouseLeave: () => setHoveredRowId(null),
              },
            }}
            sx={{
              [`& .${gridClasses.virtualScroller}`]: {
                overflowX: "hidden",
              },
            }}
            isCellEditable={(params) =>
              !(
                params.row.classification === INTERNAL_RESOURCE_ID ||
                (params.field === "classification" && params.row.classification && !classificationOptions?.user[params.row.classification])
              )
            }
            isRowSelectable={(params) => params.row.classification !== INTERNAL_RESOURCE_ID}
          />
        </Box>
      )}
    </GeneralPopup>
  );
}
