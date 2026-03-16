import { getAllDomains } from "@api/domains";
import { createPermissions, editPermissions, getPermissions, getPermissionsExcel } from "@api/permissions";
import {
  ActionIcons,
  DataGridFooterWithAddButton,
  DataGridProComponent,
  GeneralPermissionPopup,
  NoData,
  RelatedDomainsList,
  ScreenTitle,
  SearchField,
  StyledClassificationChip,
} from "@components";
import { Box, Button, Grid, SelectChangeEvent } from "@mui/material";
import { DataGridProProps, GridPagination, GridRenderCellParams } from "@mui/x-data-grid-pro";
import { Key } from "@phosphor-icons/react";
import { useSnackBarStore } from "@store/snackbarStore";
import { Domain, Permission } from "@types";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import "../styles/permissions.css";
import { useGridExternalQuickFilter } from "@helpers/useExternalQuickFilter";
import { useDatagridPaginationProps } from "@helpers/useDatagridPaginationProps";
import { AddCircle } from "@mui/icons-material";
import { saveAs } from "file-saver";
import { StickyPageHeader } from "@components/StickyPageHeader";
import { ObjectIdBrand } from "@port/shield-schemas";

function Permissions() {
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [openModalEdit, setOpenModalEdit] = useState(false);
  const [editedRow, setEditedRow] = useState<Permission>({
    _id: "" as ObjectIdBrand,
    description: "",
    name: "",
    related_domains: [],
  });
  const [newRow, setNewRow] = useState<{
    name: string;
    description: string;
    related_domains: string[];
  }>({
    description: "",
    name: "",
    related_domains: [],
  });
  const [queryState, setQueryState] = useState<"loading" | "error" | "success">("loading");
  const [rows, setRows] = useState<Permission[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const { setSnackbarSuccess, setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));
  const paginationProps = useDatagridPaginationProps();

  const { gridApiRef, handleSearch } = useGridExternalQuickFilter();

  useEffect(() => {
    getPermissions()
      .then((response) => {
        setRows(response);
        setQueryState("success");
      })
      .catch((e) => {
        setQueryState("error");
        console.error("שגיאה בעת טעינה טבלת סיווגים", e);
      });

    getAllDomains()
      .then((response) => {
        setDomains(response);
      })
      .catch((e) => {
        console.error("שגיאה בעת טעינה טבלת עולמות תוכן", e);
      });
  }, []);

  function handleEditModal(id: string) {
    const chosenRow = rows.find((row) => row._id === id);
    if (chosenRow) {
      setEditedRow({ ...chosenRow });
      setOpenModalEdit(true);
    }
  }

  function addRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpenModalAdd(false);
    createPermissions(newRow)
      .then((response) => {
        const id: ObjectIdBrand = response.data;
        const row = {
          ...newRow,
          _id: id,
          related_domains: newRow.related_domains.map((x) => {
            return {
              _id: x,
              display_name: domains.find((d) => d._id === x)?.display_name ?? "",
            };
          }),
        };
        setRows([...rows, row]);
        setSnackbarSuccess("הסיווג נוסף בהצלחה");
      })
      .catch((e) => {
        setSnackbarError("שגיאה בעת שמירת הסיווג", e);
      })
      .finally(() => {
        setNewRow({
          description: "",
          name: "",
          related_domains: [],
        });
      });
  }

  function editRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpenModalEdit(false);
    const body = { name: editedRow.name, description: editedRow.description };
    editPermissions(editedRow._id, body)
      .then(() => {
        const newRows = rows.map((row) => {
          if (row._id === editedRow._id) {
            return { ...editedRow };
          }
          return row;
        });
        setRows([...newRows]);
        setSnackbarSuccess("הסיווג נערך בהצלחה");
      })
      .catch((e) => {
        setSnackbarError("שגיאה בעת שמירת הסיווג", e);
      });
  }

  function handleEditFormChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string[]>) {
    const { name, value } = event.target;
    setEditedRow({
      ...editedRow,
      [name]: value,
    });
  }

  function handleAddFormChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string[]>) {
    const { name, value } = event.target;
    setNewRow({
      ...newRow,
      [name]: value,
    });
  }

  const columns: DataGridProProps["columns"] = [
    {
      field: "name",
      headerName: "שם רמת הרשאה",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Permission>) => <StyledClassificationChip label={params.row.name} />,
    },
    { field: "description", headerName: "תיאור", flex: 1 },
    {
      field: "related_domains",
      headerName: "עולמות תוכן מקושרים",
      flex: 2,
      getApplyQuickFilterFn: (value: string) => {
        return ({ row }) => {
          const related_domains: Permission["related_domains"] = row.related_domains;
          const valueLower = value.toLowerCase();
          return (related_domains ?? []).some((domain) => domain.display_name.includes(valueLower));
        };
      },
      renderCell: (params: GridRenderCellParams<Permission>) => <RelatedDomainsList related_domains={params.row.related_domains} />,
    },
    {
      field: "actions",
      headerName: "",
      flex: 0.18,
      sortable: false,
      filterable: false,
      renderCell: (params) => <ActionIcons id={params.id} edit={(id) => handleEditModal(String(id))} />,
    },
  ];

  const exportToExcel = async () => {
    try {
      const permissionsExcelFile = await getPermissionsExcel();
      saveAs(permissionsExcelFile, `ניהול_סיווגים.xlsb`);
    } catch (error) {
      console.log(error);
      setSnackbarError("שגיאה בעת טעינת אקסל");
    }
  };

  return (
    <Box>
      <StickyPageHeader>
        <ScreenTitle
          screenName="ניהול סיווגים"
          screenIcon={<Key color="#5f5858" fontSize={25} weight="thin" style={{ marginLeft: 5 }} />}
        />
        <Grid container justifyContent="space-between" columnSpacing={1} marginBottom="15px">
          <Grid item xs={10} textAlign="left">
            <SearchField handleSearch={handleSearch} />
          </Grid>
          <Grid item xs={1} textAlign="right">
            <Button
              variant="contained"
              color="light"
              fullWidth
              onClick={() => setOpenModalAdd(true)}
              startIcon={<AddCircle color="primary" />}
              sx={{
                border: "1px solid #dfe9f1",
              }}
            >
              הוספה
            </Button>
          </Grid>

          <Grid item xs={1} textAlign="right">
            <Button variant="contained" color="primary" onClick={exportToExcel}>
              <AddCircle />
              ייצוא לאקסל
            </Button>
          </Grid>
        </Grid>
      </StickyPageHeader>
      {openModalAdd && (
        <GeneralPermissionPopup
          openModal={openModalAdd}
          setOpenModal={setOpenModalAdd}
          title="הוספת רמת הרשאה"
          cancel={() => {
            setOpenModalAdd(false);
            setNewRow({
              description: "",
              name: "",
              related_domains: [],
            });
          }}
          onSubmit={addRow}
          onChange={handleAddFormChange}
          nameValue={newRow.name}
          descriptionValue={newRow.description}
          relatedDomains={{
            value: newRow.related_domains,
            items: domains,
          }}
        />
      )}

      {openModalEdit && (
        <GeneralPermissionPopup
          openModal={openModalEdit}
          setOpenModal={setOpenModalEdit}
          title="עריכת רמת הרשאה"
          cancel={() => setOpenModalEdit(false)}
          onSubmit={editRow}
          onChange={handleEditFormChange}
          nameValue={editedRow.name}
          descriptionValue={editedRow.description}
          relatedDomains={{
            value: editedRow.related_domains?.map((x) => x._id),
            items: domains,
            disabled: true,
          }}
        />
      )}

      <DataGridProComponent
        footer={() => (
          <DataGridFooterWithAddButton
            iconButtonProps={{
              onClick: () => setOpenModalAdd(true),
            }}
          >
            <GridPagination />
          </DataGridFooterWithAddButton>
        )}
        apiRef={gridApiRef}
        rows={rows}
        columns={columns}
        disableColumnSelector
        loading={queryState === "loading"}
        autoHeight
        {...paginationProps}
        slots={{
          noRowsOverlay: () => <NoData mainText="לא נמצאו סיווגים" secondaryText="אולי כדאי לחפש משהו אחר :)" sx={{ mx: "auto" }} />,
          noResultsOverlay: () => <NoData mainText="לא נמצאו סיווגים" secondaryText="אולי כדאי לחפש משהו אחר :)" sx={{ mx: "auto" }} />,
        }}
        sx={{
          bgcolor: "white",
          "--DataGrid-overlayHeight": "400px",
        }}
      />
    </Box>
  );
}

export default Permissions;
