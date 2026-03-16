import { createUser, editUser, getIsUserSapPermittedById, getUserByUserId } from "@api/users";
import { GeneralPopup } from "@components/Popup";
import { SelectableSegment } from "@components/SelectableSegment";
import { useLoadingContext } from "@contexts/Loading";
import { mergeUserDto } from "@helpers/users";
import { Backdrop, Box, CircularProgress, Grid } from "@mui/material";
import { User as UserIcon } from "@phosphor-icons/react";
import { useSnackBarStore } from "@store/snackbarStore";
import { useQueryClient } from "@tanstack/react-query";
import { Domain, EditUserDto, GetUserInfoDto, UserDomainDto, UserDto, UserPermissionTableDto, UserRowFilterValueDto } from "@types";
import { useMemo, useState } from "react";
import Preview from "./Preview/Preview";
import SaveDataPermissionsPopup from "./SaveUserPopup/SaveUserPopup";
import { UserDomains } from "./UserDomains";
import { UserInfo } from "./UserInfo/UserInfo";
import { INITIAL_EMPTY_USER } from "./UserInfo/constants";
import UserPermissionTables from "./UserPermissionTables/UserPermissionTables";
import { calcUserDiff } from "./diff.utils";
import { AccordionProvider } from "./Preview/AccordionProvider";

const GRID_BORDER_STYLE = "solid 2px #e8ebef";

type TabType = "PermissionTables" | "Preview";

type Tab = {
  type: TabType;
  title: string;
};

const tabs: Array<Tab> = [
  {
    type: "PermissionTables",
    title: "טבלאות סינון",
  },
  {
    type: "Preview",
    title: "תצוגה מקדימה",
  },
];

type Props = {
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  editedUser?: UserDto;
  handleChangeEditedUser?: (user: UserDto, isNewUser: boolean) => void;
  domainsOptions: Domain[];
  domainsOptionsMap: Map<string, Domain>;
};

export function ManageUserPopUp({ openModal, setOpenModal, editedUser, handleChangeEditedUser, domainsOptions, domainsOptionsMap }: Props) {
  const { setSnackbarSuccess, setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));
  const [initialUser, setInitialUser] = useState(editedUser ?? INITIAL_EMPTY_USER);
  const [user, setUser] = useState(initialUser);
  const [isSavePopupOpen, setIsSavePopupOpen] = useState(false);
  const [isSearchingMode, setIsSearchingMode] = useState<boolean>(!editedUser);
  const [selectedTab, setSelectedTab] = useState<TabType>("PermissionTables");
  const { setLoading } = useLoadingContext();
  const queryClient = useQueryClient();

  const mergedUser = useMemo(() => mergeUserDto(user), [user]);
  const { changedAttributes, domainsDiff, permissionTablesDiff, permissionsGroupsDiff, readAllDiff } = useMemo(
    () => calcUserDiff(mergeUserDto(initialUser), mergedUser),
    [initialUser, mergedUser],
  );
  const [isModalLoading, setIsModalLoading] = useState(false);

  const isUserChanged = Boolean(
    Object.keys(changedAttributes).length ||
      domainsDiff.deleted.length ||
      domainsDiff.new.length ||
      domainsDiff.updated.length ||
      permissionTablesDiff.deleted.length ||
      permissionTablesDiff.updated.length ||
      permissionTablesDiff.new.length ||
      permissionsGroupsDiff.deletedPermissionGroups.length ||
      permissionsGroupsDiff.newPermissionGroups.length ||
      readAllDiff,
  );

  const handleChangeUser = async (selectedUser: GetUserInfoDto | null) => {
    if (selectedUser) {
      const existingUser = await getUserByUserId(selectedUser.user_id);

      if (existingUser) {
        setInitialUser(existingUser);
        setUser(existingUser);
      } else {
        const isUserSapPermitted = await getIsUserSapPermittedById(selectedUser.user_id);

        setUser((prevUser) => ({
          ...prevUser,
          ...selectedUser,
          is_sap_permitted: !!isUserSapPermitted,
        }));
      }
      setIsSearchingMode(false);
    }
  };

  const handleDeleteDomain = (domainId: string) => {
    setUser((prevUser) => {
      const filterdDomains = prevUser.domains.filter((domain) => domain.id !== domainId);

      return {
        ...prevUser,
        domains: filterdDomains,
      };
    });
  };

  const handleAddDomains = async (newDomains: UserDomainDto[]) => {
    setUser((prevUser) => {
      return {
        ...prevUser,
        domains: [...prevUser.domains, ...newDomains],
      };
    });
  };

  const handleDeleteUserClassifications = (classificationIds: string[], domainId: string) => {
    setUser((prevUser) => {
      return {
        ...prevUser,
        domains: prevUser.domains.map((d) => {
          if (d.id !== domainId) return d;
          else {
            return {
              ...d,
              classifications: d.classifications.filter((c) => !classificationIds.includes(c._id)),
            };
          }
        }),
      };
    });
  };

  const handleSaveUserClassifications = (classifications: UserDomainDto["classifications"], domainId: string) => {
    setUser((prevUser) => {
      const hasDomain = prevUser.domains.some((domain) => domain.id === domainId);

      if (hasDomain) {
        return {
          ...prevUser,
          domains: prevUser.domains.map((domain) => (domain.id === domainId ? { ...domain, classifications } : domain)),
        };
      } else {
        const domainFromMerged = mergedUser.domains.find((domain) => domain.id === domainId);

        if (!domainFromMerged) {
          return prevUser;
        }

        return {
          ...prevUser,
          domains: [
            ...prevUser.domains,
            {
              ...domainFromMerged,
              classifications,
            },
          ],
        };
      }
    });
  };

  const setUserRowFilterValues = (
    permission_table_id: string | undefined,
    rowFilter: string,
    newRowFilterValues: UserRowFilterValueDto[],
  ) => {
    setUser((prevUser) => {
      return {
        ...prevUser,
        permission_tables: prevUser.permission_tables?.map((table) => {
          if (table.id !== permission_table_id) return table;

          return {
            ...table,
            row_filters: table.row_filters.map((r) => {
              if (r.kod !== rowFilter) return r;
              return { ...r, values: newRowFilterValues };
            }),
          };
        }),
      };
    });
  };

  const setUserPermissionTables = (newUserPermissionTables: UserPermissionTableDto[]) => {
    setUser((prevUser) => ({
      ...prevUser,
      permission_tables: newUserPermissionTables,
    }));
  };

  const handleDeleteUserRowFilterValue = (
    permission_table_id: string | undefined,
    rowFilter: string,
    values: UserRowFilterValueDto["value"][],
  ) => {
    setUser((prevUser) => {
      return {
        ...prevUser,
        permission_tables: prevUser.permission_tables?.map((d) => {
          if (d.id !== permission_table_id) return d;

          return {
            ...d,
            row_filters: d.row_filters.map((r) => {
              if (r.kod !== rowFilter) return r;
              return {
                ...r,
                values: r.values.filter((v) => !values.includes(v.value)),
              };
            }),
          };
        }),
      };
    });
  };

  const handleAddUserRowFilterValue = (
    permission_table_id: string | undefined,
    rowFilter: string,
    rowFilterValues: UserRowFilterValueDto[],
  ) => {
    setUser((prevUser) => {
      return {
        ...prevUser,
        permission_tables: prevUser.permission_tables?.map((d) => {
          if (d.id !== permission_table_id) return d;

          return {
            ...d,
            row_filters: d.row_filters.map((r) => {
              if (r.kod !== rowFilter) return r;
              return { ...r, values: [...r.values, ...rowFilterValues] };
            }),
          };
        }),
      };
    });
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      const domains = user.domains.map((domain) => ({
        id: domain.id,
        classifications: domain.classifications.map((c) => c._id),
      }));

      const permission_tables: EditUserDto["permission_tables"] = user.permission_tables.map((permissionTable) => ({
        id: permissionTable.id,
        row_filters: permissionTable.row_filters.map((row_filter) => ({
          kod: row_filter.kod,
          values: row_filter.values.map(({ value }) => value),
        })),
      }));

      const data: EditUserDto = {
        attributes: user.attributes,
        domains,
        permission_tables,
        permission_groups: user.permission_groups.map((group) => group._id),
        is_read_all: user.is_read_all,
      };
      let localUser: UserDto;
      const isNewUser = user._id === INITIAL_EMPTY_USER._id;

      if (isNewUser) {
        localUser = await createUser({ user_id: user.user_id, ...data });
      } else {
        localUser = (await editUser(user._id, data)).user;
      }

      handleChangeEditedUser?.(localUser, isNewUser);

      const userPermissionGroups = [...localUser.permission_groups, ...user.permission_groups];

      userPermissionGroups.forEach((group) =>
        queryClient.invalidateQueries({ queryKey: ["user", "getUsersByPermissionGroup", group._id], exact: true }),
      );
      queryClient.invalidateQueries({ queryKey: ["user", "liveColumnsByTable", user.user_id] });
      queryClient.invalidateQueries({ queryKey: ["user", "liveTablesByUser", user.user_id] });
      setSnackbarSuccess("המשתמש נשמר בהצלחה");
    } catch {
      setSnackbarError("שגיאה בעת שמירת המשתמש");
    } finally {
      setLoading(false);
      setIsSavePopupOpen(false);
      setOpenModal(false);
    }
  };

  return (
    <GeneralPopup
      open={openModal}
      onClose={() => setOpenModal(false)}
      title="ניהול הרשאות משתמש"
      titleIcon={
        <UserIcon
          style={{
            backgroundColor: "orange",
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
          }}
          fontSize={25}
          color="#fff"
        />
      }
      actionsButtonsProps={{
        enable: true,
        handleSave: () => setIsSavePopupOpen(true),
        disableSave: !isUserChanged,
      }}
      fullWidth={true}
      maxWidth={false}
      PaperProps={{
        style: {
          height: "90vh",
        },
      }}
      dialogContentProps={{
        sx: {
          px: 0,
        },
      }}
      disableBackdropClick
    >
      <Box position="relative" height="100%">
        <Backdrop
          open={isModalLoading}
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1000, position: "absolute", background: "rgba(0, 0, 0, 0.2)" }}
        >
          <CircularProgress size="100px" />
        </Backdrop>
        <Grid container alignItems={"stretch"} sx={{ height: "100%" }} borderTop={GRID_BORDER_STYLE} borderBottom={GRID_BORDER_STYLE}>
          <Grid item xs={2} p={1}>
            <UserInfo
              user={mergedUser}
              setUser={setUser}
              handleChangeUser={handleChangeUser}
              isSearchingMode={isSearchingMode}
              onPermissionGroupDataPermissionsFetchStart={() => setIsModalLoading(true)}
              onPermissionGroupDataPermissionsFetchEnd={() => setIsModalLoading(false)}
            />
          </Grid>
          <Grid item xs={5} borderLeft={GRID_BORDER_STYLE} pt={1} height="100%">
            <UserDomains
              userDomains={mergedUser.domains}
              domainsOptions={domainsOptions}
              domainsOptionsMap={domainsOptionsMap}
              isAddDomainsButtonDisabled={isSearchingMode}
              handleDeleteDomain={handleDeleteDomain}
              handleAddDomains={handleAddDomains}
              handleDeleteClassifications={handleDeleteUserClassifications}
              handleSaveClassifications={handleSaveUserClassifications}
            />
          </Grid>
          <Grid item xs={5} borderLeft={GRID_BORDER_STYLE} borderRight={GRID_BORDER_STYLE} pt={1} height="100%" bgcolor="#f2f3fc">
            <Box display={"flex"} justifyContent={"center"}>
              <Box borderRadius={2} padding="4px" display="inline-flex" bgcolor={"#e5e7f9"} justifyContent={"center"} width={"95%"}>
                {tabs.map((tab) => (
                  <SelectableSegment
                    key={tab.type}
                    title={tab.title}
                    width={"50%"}
                    justifyContent={"center"}
                    onClick={() => setSelectedTab(tab.type)}
                    selected={tab.type === selectedTab}
                    selectedStyle={{ backgroundColor: "white" }}
                    borderRadius={1}
                    padding="3px 10px 3px 10px"
                    display="flex"
                    alignItems="center"
                    gap="6px"
                    color={tab.type === selectedTab ? "blue" : undefined}
                    fontWeight={500}
                  />
                ))}
              </Box>
            </Box>
            <Box
              sx={{
                overflow: "auto",
                height: "90%",
                maxHeight: "90%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f2f3fc",
                p: 1,
              }}
            >
              {selectedTab === "PermissionTables" && (
                <UserPermissionTables
                  userPermissionTables={user.permission_tables}
                  mergedPermissionTables={mergedUser.permission_tables}
                  handleAddUserRowFilterValue={handleAddUserRowFilterValue}
                  handleDeleteRowFilterValue={handleDeleteUserRowFilterValue}
                  setUserRowFilterValues={setUserRowFilterValues}
                  setUserPermissionTables={setUserPermissionTables}
                  userDomains={mergedUser.domains}
                />
              )}
              <AccordionProvider>
                {selectedTab === "Preview" && (
                  <Preview
                    addionalSx={{
                      backgroundColor: "#f2f3fc",
                    }}
                    user={mergedUser}
                    type={user._id === INITIAL_EMPTY_USER._id ? "new" : "compare"}
                  />
                )}
              </AccordionProvider>
            </Box>
          </Grid>
        </Grid>
        {isSavePopupOpen && (
          <SaveDataPermissionsPopup
            type="user"
            open={isSavePopupOpen}
            onClose={() => setIsSavePopupOpen(false)}
            handleSave={handleSaveUser}
            userData={mergedUser}
            changedAttributes={changedAttributes}
            permissionTablesDiff={permissionTablesDiff}
            domainsDiff={domainsDiff}
            permissionGroupDiff={permissionsGroupsDiff}
          />
        )}
      </Box>
    </GeneralPopup>
  );
}
