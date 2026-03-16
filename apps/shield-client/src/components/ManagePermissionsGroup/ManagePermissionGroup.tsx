import { getUsersByPermissionGroupOptions, useAddPermissionGroupToUsers, useDeletePermissionGroupFromUser } from "@api/users";
import { GeneralPopup } from "@components/Popup";
import UserFullNameTooltip from "@components/UserFullNameTooltip";
import { toFullName } from "@helpers/toFullName";
import { useGridExternalQuickFilter } from "@helpers/useExternalQuickFilter";
import { AddCircle } from "@mui/icons-material";
import { Box, Button, Grid, Typography } from "@mui/material";
import { GridColDef, GridPagination } from "@mui/x-data-grid-pro";
import { IdentificationBadge, PencilSimple, Table } from "@phosphor-icons/react";
import { formatDate } from "@port/utils";
import { useSnackBarStore } from "@store/snackbarStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetUserInfoDto, PermissionGroupForm } from "@types";
import { Dispatch, SetStateAction, useState } from "react";
import {
  ActionIcons,
  CardUserHeaderActionIcon,
  DataGridFooterWithAddButton,
  DataGridProComponent,
  NoData,
  SearchField,
  SelectableSegment,
} from "..";
import { AddUsersPermissionGroupsPopup } from "./AddUsersPermissionGroupsPopup";
import { useDatagridPaginationProps } from "@helpers/useDatagridPaginationProps";
import { UsersThree } from "@phosphor-icons/react";
import { editPermissionGroupDetails, useMemberEditablePermissionGroups } from "@api/permissionGroups";
import { EditPermissionGroupsPopup } from "./EditPermissionGroupsPopup";
import { PermissionGroupsDto } from "@port/shield-schemas";
import DataPermissionsTab from "./DataPermissionsTab";

type TabType = "Permissions" | "UsersList";

type Props = {
  openModal: boolean;
  setOpenModal: Dispatch<SetStateAction<boolean>>;
  permissionGroup: PermissionGroupsDto;
};

type Tab = {
  type: TabType;
  title: string;
  icon?: React.ReactNode;
};

const tabs: Array<Tab> = [
  {
    type: "UsersList",
    title: "קבוצת משתמשים",
    icon: <IdentificationBadge fontSize={20} />,
  },
  {
    type: "Permissions",
    title: "הרשאה",
    icon: <Table fontSize={20} />,
  },
];

export const ManagePermissionGroupPopup = ({ openModal, setOpenModal, permissionGroup }: Props) => {
  const { data: memberEditablePermissionGroups } = useMemberEditablePermissionGroups();
  const paginationProps = useDatagridPaginationProps();
  const [selectedTab, setSelectedTab] = useState<TabType>("UsersList");
  const { gridApiRef, handleSearch } = useGridExternalQuickFilter();
  const [addedUsers, setAddedUsers] = useState<GetUserInfoDto[]>([]);
  const [openModalAddUsers, setOpenModalAddUsers] = useState<boolean>(false);
  const { setSnackbarSuccess, setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));
  const [openModalEdit, setOpenModalEdit] = useState(false);
  const queryClient = useQueryClient();
  const { data: users, isLoading: getUsersLoading } = useQuery(getUsersByPermissionGroupOptions(permissionGroup._id));
  const { mutate: addPermissionGroupToUsers } = useAddPermissionGroupToUsers({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "getUsersByPermissionGroup", permissionGroup._id], exact: true });
      setSnackbarSuccess("הוספת המשתמשים עברה בהצלחה");
    },
    onError: () => {
      setSnackbarError(`שגיאה בעת הוספת משתמשים לקבוצת ההרשאות - ${permissionGroup.name}`);
    },
    onSettled: () => {
      setAddedUsers([]);
      setOpenModalAddUsers(false);
    },
  });

  const sumbitEditPermissionGroup = async (permisionGroup: PermissionGroupForm) => {
    setOpenModalEdit(false);
    try {
      await editPermissionGroupDetails(permissionGroup._id, permisionGroup);
      queryClient.setQueryData(["permissionGroups"], (oldData: PermissionGroupsDto[] | undefined) =>
        oldData?.map((row) => {
          if (row._id === permissionGroup._id) {
            return { ...permissionGroup };
          }
          return row;
        }),
      );

      setSnackbarSuccess("קבוצת ההרשאה נערך בהצלחה");
    } catch (error) {
      setSnackbarError("שגיאה בעת שמירת קבוצת ההרשאה", error);
    } finally {
      queryClient.invalidateQueries({ queryKey: ["permissionGroups"] });
    }
  };

  const { mutate: deletePermissionGroupToUsers } = useDeletePermissionGroupFromUser({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "getUsersByPermissionGroup", permissionGroup._id], exact: true });
      setSnackbarSuccess("מחיקת המשתמשים עברה בהצלחה");
    },
    onError: () => {
      setSnackbarError(`שגיאה בעת מחיקת משתמשים לקבוצת ההרשאות - ${permissionGroup.name}`);
    },
  });

  const columns: GridColDef<NonNullable<typeof users>[number]>[] = [
    { field: "user_id", headerName: "מספר אישי", flex: 1, valueGetter: ({ row }) => row.user_id },
    {
      field: "name",
      headerName: "שם משתמש",
      flex: 1,
      valueGetter: ({ row }) => {
        return `${row.first_name} ${row.last_name}`;
      },
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          {toFullName(params.row, "לא קיים שם משתמש")}
        </Box>
      ),
    },
    {
      field: "given_by",
      headerName: 'הרשאה ניתנה ע"י',
      flex: 1,
      valueGetter: ({ row }) => row.given_by,
      renderCell: (params) =>
        params.row.given_by && (
          <UserFullNameTooltip user_id={params.row.given_by}>
            <Box sx={{ display: "flex", alignContent: "center" }}>{params.row.given_by}</Box>
          </UserFullNameTooltip>
        ),
    },
    {
      field: "registration_date",
      headerName: "תאריך רישום",
      flex: 1,
      valueGetter: ({ row }) => (row.registration_date ? formatDate(row.registration_date) : ""),
    },
    {
      field: "actions",
      headerName: "",
      flex: 0.15,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <ActionIcons
          id={row._id}
          disableDelete={!memberEditablePermissionGroups?.includes(permissionGroup._id)}
          deleteAction={(userObjectId) => deletePermissionGroupToUsers({ permissionGroupId: permissionGroup._id, userObjectId })}
        />
      ),
    },
  ];

  const handleConfirmAddedUsers = async (validDestinationUsers: GetUserInfoDto[]) => {
    const validDestinationUsersIds = validDestinationUsers.map(({ user_id }) => user_id);
    addPermissionGroupToUsers({ permissionGroupId: permissionGroup._id, users: validDestinationUsersIds });
  };

  return (
    <GeneralPopup
      open={openModal}
      onClose={() => setOpenModal(false)}
      title={
        <Box display={"flex"} flexDirection={"column"} gap={1}>
          <Box display={"flex"} height={20} gap={1} margin={1} alignContent={"center"} alignItems={"center"}>
            <UsersThree
              style={{
                padding: 2,
                borderRadius: 2,
              }}
              fontSize={"25px"}
            />

            <Typography style={{ fontSize: "25px" }}>{permissionGroup.name}</Typography>
            <CardUserHeaderActionIcon
              onClick={(e) => {
                e.stopPropagation();
                setOpenModalEdit(true);
              }}
              aria-label="edit"
            >
              <PencilSimple weight="bold" color="#475467" style={{ width: 20, height: 20 }} />
            </CardUserHeaderActionIcon>
          </Box>
          <Typography ml={3} style={{ fontSize: "17px" }}>
            {permissionGroup.description}
          </Typography>
        </Box>
      }
      fullWidth={true}
      maxWidth={false}
      PaperProps={{
        style: {
          height: "90vh",
        },
      }}
      dialogContentProps={{
        sx: {
          p: 0,
        },
      }}
    >
      <Box margin={3} borderRadius={2} display="flex" width="fit-content" columnGap={3}>
        <Box borderRadius={2} padding="4px" display="inline-flex" bgcolor="#E5E7F9">
          {tabs.map((tab) => (
            <SelectableSegment
              key={tab.type}
              title={tab.title}
              icon={tab.icon}
              onClick={() => setSelectedTab(tab.type)}
              selected={tab.type === selectedTab}
              selectedStyle={{ backgroundColor: "white" }}
              borderRadius={1}
              padding="3px 10px 3px 10px"
              display="flex"
              alignItems="center"
              gap="6px"
            />
          ))}
        </Box>
      </Box>
      {openModalEdit && (
        <EditPermissionGroupsPopup
          openModal={openModalEdit}
          setOpenModal={setOpenModalEdit}
          title="עריכת קבוצת הרשאה"
          cancel={() => setOpenModalEdit(false)}
          onSubmit={sumbitEditPermissionGroup}
          selectedPermissionGroup={permissionGroup}
        />
      )}

      <Box display={selectedTab === "Permissions" ? "flex" : "none"} justifyContent="center" height="88%">
        <DataPermissionsTab permissionGroup={permissionGroup} display={selectedTab === "Permissions"} />
      </Box>

      {selectedTab === "UsersList" && (
        <Box padding={3}>
          <Grid container justifyContent="space-between" columnSpacing={1} marginBottom="15px">
            <Grid item xs={10} textAlign="left">
              <SearchField handleSearch={handleSearch} />
            </Grid>
            <Grid item xs={1.2} textAlign="right">
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => setOpenModalAddUsers(true)}
                startIcon={<AddCircle />}
                sx={{
                  border: "1px solid #dfe9f1",
                }}
                disabled={!memberEditablePermissionGroups?.includes(permissionGroup._id)}
              >
                הוספת משתמשים
              </Button>
            </Grid>
          </Grid>
          {openModalAddUsers && (
            <AddUsersPermissionGroupsPopup
              openModalAddUsers={openModalAddUsers}
              permissionGroup={permissionGroup}
              onClose={() => {
                setOpenModalAddUsers(false);
                setAddedUsers([]);
              }}
              addedUsers={addedUsers}
              setAddedUsers={setAddedUsers}
              handleConfirmAddedUsers={() => handleConfirmAddedUsers(addedUsers)}
            />
          )}

          <DataGridProComponent
            footer={() => (
              <DataGridFooterWithAddButton
                iconButtonProps={{
                  onClick: () => setOpenModalAddUsers(true),
                }}
              >
                <GridPagination />
              </DataGridFooterWithAddButton>
            )}
            apiRef={gridApiRef}
            rows={users ?? []}
            columns={columns}
            getRowId={(row) => row._id}
            disableColumnSelector
            loading={getUsersLoading}
            autoHeight
            {...paginationProps}
            slots={{
              noRowsOverlay: () => <NoData mainText="אין משתמשים בקבוצה" secondaryText="אולי כדאי להוסיף משתמשים :)" sx={{ mx: "auto" }} />,
              noResultsOverlay: () => <NoData mainText="לא נמצאו משתמשים" secondaryText="אולי כדאי לחפש משהו אחר :)" sx={{ mx: "auto" }} />,
            }}
            sx={{
              bgcolor: "white",
              "--DataGrid-overlayHeight": "400px",
            }}
          />
        </Box>
      )}
    </GeneralPopup>
  );
};
