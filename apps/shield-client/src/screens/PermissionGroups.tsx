import { createPermissionGroups, deletePermissionGroups, getPermissionGroupsExcel, useGetPermissionGroups } from "@api/permissionGroups";
import {
  ActionIcons,
  DataGridFooterWithAddButton,
  DataGridProComponent,
  NoData,
  ScreenTitle,
  SearchField,
  StyledClassificationChip,
  WarningDeletePopup,
} from "@components";
import { ManagePermissionGroupPopup, CreatePermissionGroupsPopup } from "@components/ManagePermissionsGroup";
import UserFullNameTooltip from "@components/UserFullNameTooltip";
import { useDatagridPaginationProps } from "@helpers/useDatagridPaginationProps";
import { useGridExternalQuickFilter } from "@helpers/useExternalQuickFilter";
import { AddCircle } from "@mui/icons-material";
import { Box, Button, Grid } from "@mui/material";
import { GridColDef, GridPagination } from "@mui/x-data-grid-pro";
import { Key } from "@phosphor-icons/react";
import { useSnackBarStore } from "@store/snackbarStore";
import { useQueryClient } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import { useEffect, useMemo, useState } from "react";
import "../styles/permissions.css";
import { CreatePermissionGroupDto, PermissionGroup, PermissionGroupsDto, SHIELD_ROLE_NAME, ShieldRoleName } from "@port/shield-schemas";
import { useLoggedUserInfo } from "@api/auth";
import { StickyPageHeader } from "@components/StickyPageHeader";

const PermissionGroups = () => {
  const { data: loggedUser } = useLoggedUserInfo();
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const [openModalManagePermissionGroup, setOpenModalManagePermissionGroup] = useState(false);
  const [selectedPermissionGroupId, setSelectedPermissionGroupId] = useState<string | null>(null);
  const { setSnackbarSuccess, setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));
  const paginationProps = useDatagridPaginationProps();
  const { gridApiRef, handleSearch } = useGridExternalQuickFilter();
  const { data: permission_groups, isLoading, isError } = useGetPermissionGroups();
  const queryClient = useQueryClient();
  const selectedPermissionGroup = useMemo<PermissionGroupsDto | null>(() => {
    return selectedPermissionGroupId
      ? (permission_groups?.find((permissionGroup) => permissionGroup._id === selectedPermissionGroupId) ?? null)
      : null;
  }, [permission_groups, selectedPermissionGroupId]);

  useEffect(() => {
    if (isError) {
      setSnackbarError("שגיאה בעת טעינת קבוצות ההרשאה");
    }
  }, [isError]);

  const handleDeleteModal = (id: string) => {
    setSelectedPermissionGroupId(id);
    setOpenModalDelete(true);
  };

  const addRow = async (newPermissionGroup: CreatePermissionGroupDto) => {
    setOpenModalAdd(false);
    if (permission_groups?.find((group) => group.name === newPermissionGroup.name)) {
      setSnackbarError("קבוצת ההרשאה כבר קיימת");
      return;
    }

    try {
      const createdPermissionGroupId = (await createPermissionGroups(newPermissionGroup)).data;
      queryClient.setQueryData(["permissionGroups"], (oldData: PermissionGroup[]) => [
        ...oldData,
        {
          ...selectedPermissionGroup,
          _id: createdPermissionGroupId,
        },
      ]);
      setSnackbarSuccess("קבוצת ההרשאה נוספה בהצלחה");
    } catch (error) {
      console.log(error);
      setSnackbarError("שגיאה בעת שמירת קבוצת ההרשאה", error);
    } finally {
      setSelectedPermissionGroupId(null);
      queryClient.invalidateQueries({ queryKey: ["permissionGroups"] });
    }
  };

  const deleteRow = async () => {
    try {
      await deletePermissionGroups(selectedPermissionGroupId!);
      setOpenModalDelete(false);
      queryClient.setQueryData(["permissionGroups"], (oldData: PermissionGroup[]) =>
        oldData.filter((row) => row._id !== selectedPermissionGroupId),
      );
      setSnackbarSuccess("קבוצת ההרשאה נמחקה בהצלחה");
    } catch (error) {
      setSnackbarError("שגיאה בעת מחיקת קבוצת ההרשאה", error);
    }
  };

  const columns: GridColDef<NonNullable<typeof permission_groups>[number]>[] = [
    {
      field: "name",
      headerName: "שם קבוצת ההרשאה",
      flex: 0.5,
      renderCell: (params) => (
        <StyledClassificationChip
          sx={{ backgroundColor: "white" }}
          onClick={() => {
            setSelectedPermissionGroupId(params.row._id);
            setOpenModalManagePermissionGroup(true);
          }}
          label={
            <Box display={"flex"} alignItems="center" gap={1}>
              <Box bgcolor={params.row.color} height={7} width={7} borderRadius={9999} />
              {params.row.name}
            </Box>
          }
        />
      ),
    },
    {
      field: "owner",
      headerName: 'נוצר ע"י',
      flex: 0.3,
      renderCell: (params) => (
        <UserFullNameTooltip user_id={params.row.ownerId}>
          <Box sx={{ display: "flex", alignContent: "center" }}>{params.row.ownerId}</Box>
        </UserFullNameTooltip>
      ),
    },
    { field: "description", headerName: "תיאור", flex: 1 },
    {
      field: "actions",
      headerName: "",
      flex: 0.13,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <ActionIcons
          id={params.id}
          edit={() => {
            setSelectedPermissionGroupId(params.row._id);
            setOpenModalManagePermissionGroup(true);
          }}
          deleteAction={(id) => handleDeleteModal(String(id))}
          disableDelete={!params.row.can_delete}
        />
      ),
    },
  ];

  const exportToExcel = async () => {
    try {
      const permissionsExcelFile = await getPermissionGroupsExcel();

      saveAs(permissionsExcelFile, `ניהול_קבוצות_הרשאה.xlsb`);
    } catch {
      setSnackbarError("שגיאה בעת טעינת אקסל");
    }
  };

  return (
    <Box>
      <StickyPageHeader>
        <ScreenTitle
          screenName="ניהול קבוצות הרשאה"
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
            <Button
              variant="contained"
              color="primary"
              onClick={exportToExcel}
              disabled={
                !(
                  loggedUser &&
                  (loggedUser.isAdmin ||
                    loggedUser.roleNames.some((role) =>
                      ([SHIELD_ROLE_NAME.amlach, SHIELD_ROLE_NAME.rav_amlach] as ShieldRoleName[]).includes(role),
                    ))
                )
              }
            >
              <AddCircle />
              ייצוא לאקסל
            </Button>
          </Grid>
        </Grid>
      </StickyPageHeader>

      {openModalAdd && (
        <CreatePermissionGroupsPopup
          openModal={openModalAdd}
          setOpenModal={setOpenModalAdd}
          title="הוספת קבוצת הרשאה"
          cancel={() => {
            setOpenModalAdd(false);
          }}
          onSubmit={addRow}
        />
      )}

      {openModalDelete && (
        <WarningDeletePopup
          openDelete={openModalDelete}
          setOpenDelete={setOpenModalDelete}
          handleConfirmDelete={deleteRow}
          title={`מחיקת קבוצת הרשאה ${selectedPermissionGroup?.name}`}
        />
      )}
      {openModalManagePermissionGroup && selectedPermissionGroup && (
        <ManagePermissionGroupPopup
          openModal={openModalManagePermissionGroup}
          setOpenModal={setOpenModalManagePermissionGroup}
          permissionGroup={selectedPermissionGroup}
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
        rows={permission_groups ?? []}
        columns={columns}
        disableColumnSelector
        loading={isLoading}
        autoHeight
        {...paginationProps}
        slots={{
          noRowsOverlay: () => <NoData mainText="לא נמצאו קבוצות הרשאה" secondaryText="אולי כדאי לחפש משהו אחר :)" sx={{ mx: "auto" }} />,
          noResultsOverlay: () => (
            <NoData mainText="לא נמצאו קבוצות הרשאה" secondaryText="אולי כדאי לחפש משהו אחר :)" sx={{ mx: "auto" }} />
          ),
        }}
        sx={{
          bgcolor: "white",
          "--DataGrid-overlayHeight": "400px",
        }}
      />
    </Box>
  );
};

export default PermissionGroups;
