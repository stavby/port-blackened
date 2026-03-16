import { editPermissionGroupsDataPermissions } from "@api/permissionGroups";
import { useHasPermissionsForDeceasedPopulations, useHasPermissionsForMask } from "@api/users";
import SaveDataPermissionsPopup from "@components/ManageUserPopup/SaveUserPopup/SaveUserPopup";
import { UserDomains } from "@components/ManageUserPopup/UserDomains";
import { UserAttribute } from "@components/ManageUserPopup/UserInfo/UserAttribute";
import { UserInfoCard } from "@components/ManageUserPopup/UserInfo/UserInfo.styles";
import { DECEASED_POPULATION_OPTIONS, MASK_OPTIONS } from "@components/ManageUserPopup/UserInfo/constants";
import UserPermissionTables from "@components/ManageUserPopup/UserPermissionTables/UserPermissionTables";
import { useLoadingContext } from "@contexts/Loading";
import { formatPermissionGroupDataPermissions } from "@helpers/permissionGroups";
import { Box, Button, CardContent, Grid } from "@mui/material";
import {
  EditPermissionGroupPermissionsDto,
  GetPermissionGroupDataPermissionsDto,
  ObjectIdBrand,
  PermissionGroupsDto,
} from "@port/shield-schemas";
import { useSnackBarStore } from "@store/snackbarStore";
import { useQueryClient } from "@tanstack/react-query";
import {
  Domain,
  FormattedPermissionGroupDataPermissions,
  PermissionGroupDataPermissionsDomain,
  PermissionGroupDataPermissionsPermissionTable,
} from "@types";
import { useMemo, useState } from "react";
import { calcPermissionGroupDataPermissionsDiff } from "./diff.utils";

const GRID_BORDER_STYLE = "solid 2px #e8ebef";

interface DataPermissionsFormProps {
  permissionGroup: PermissionGroupsDto;
  initialPermissionGroupDataPermissions: GetPermissionGroupDataPermissionsDto;
  domainsOptions: Domain[];
  disabled: boolean;
  display: boolean;
}

const DataPermissionsForm = ({
  permissionGroup,
  initialPermissionGroupDataPermissions,
  domainsOptions,
  disabled,
  display,
}: DataPermissionsFormProps) => {
  const [formDataPermissions, setFormDataPermissions] = useState(initialPermissionGroupDataPermissions);
  const [isSavePopupOpen, setIsSavePopupOpen] = useState(false);
  const { setLoading } = useLoadingContext();
  const { setSnackbarSuccess, setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));

  const formattedPermissionGroup = useMemo(() => formatPermissionGroupDataPermissions(formDataPermissions), [formDataPermissions]);
  const domainIds = useMemo(() => {
    return formattedPermissionGroup.domains.map((domain) => domain.id);
  }, [formattedPermissionGroup.domains]);
  const { data: hasPermissionsForMask, isLoading: permissionsForMaskLoading } = useHasPermissionsForMask(domainIds);
  const { data: hasPermissionsForDeceasedPopulations, isLoading: deceasedPopulationsLoading } =
    useHasPermissionsForDeceasedPopulations(domainIds);
  const { changedAttributes, domainsDiff, permissionTablesDiff } = useMemo(
    () =>
      calcPermissionGroupDataPermissionsDiff(
        formatPermissionGroupDataPermissions(initialPermissionGroupDataPermissions),
        formattedPermissionGroup,
      ),
    [initialPermissionGroupDataPermissions, formattedPermissionGroup],
  );
  const queryClient = useQueryClient();

  const domainsOptionsMap = useMemo(
    () => new Map(domainsOptions.map((domainOption) => [domainOption._id, domainOption])),
    [domainsOptions],
  );

  const isDataPermissionsChanged = Boolean(
    Object.keys(changedAttributes).length ||
      domainsDiff.deleted.length ||
      domainsDiff.new.length ||
      domainsDiff.updated.length ||
      permissionTablesDiff.deleted.length ||
      permissionTablesDiff.updated.length ||
      permissionTablesDiff.new.length,
  );

  const handleDeleteDomain = (domainId: string) => {
    setFormDataPermissions((prevDataPermissions) => {
      const filterdDomains = prevDataPermissions.domains.filter((domain) => domain.id !== domainId);

      return {
        ...prevDataPermissions,
        domains: filterdDomains,
      };
    });
  };

  const handleAddDomains = async (newDomains: PermissionGroupDataPermissionsDomain[]) => {
    setFormDataPermissions((prevDataPermissions) => {
      return {
        ...prevDataPermissions,
        domains: [...prevDataPermissions.domains, ...newDomains],
      };
    });
  };

  const handleDeleteUserClassifications = (classificationIds: ObjectIdBrand[], domainId: ObjectIdBrand) => {
    setFormDataPermissions((prevDataPermissions) => {
      return {
        ...prevDataPermissions,
        domains: prevDataPermissions.domains.map((domain) => {
          if (domain.id !== domainId) return domain;
          else {
            return {
              ...domain,
              classifications: domain.classifications.filter((c) => !classificationIds.includes(c._id)),
            };
          }
        }),
      };
    });
  };

  const handleSaveUserClassifications = (
    classifications: PermissionGroupDataPermissionsDomain["classifications"],
    domainId: ObjectIdBrand,
  ) => {
    setFormDataPermissions((prevDataPermissions) => ({
      ...prevDataPermissions,
      domains: prevDataPermissions.domains.map((domain) => (domain.id === domainId ? { ...domain, classifications } : domain)),
    }));
  };

  const setUserRowFilterValues = (
    permission_table_id: string | undefined,
    rowFilter: string,
    newRowFilterValues: PermissionGroupDataPermissionsPermissionTable["row_filters"][number]["values"],
  ) => {
    setFormDataPermissions((prevDataPermissions) => {
      return {
        ...prevDataPermissions,
        permission_tables: prevDataPermissions.permission_tables?.map((table) => {
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

  const setUserPermissionTables = (newUserPermissionTables: FormattedPermissionGroupDataPermissions["permission_tables"]) => {
    setFormDataPermissions((prevDataPermissions) => ({
      ...prevDataPermissions,
      permission_tables: newUserPermissionTables,
    }));
  };

  const handleDeleteUserRowFilterValue = (
    permission_table_id: string | undefined,
    rowFilter: string,
    values: PermissionGroupDataPermissionsPermissionTable["row_filters"][number]["values"][number]["value"][],
  ) => {
    setFormDataPermissions((prevDataPermissions) => {
      return {
        ...prevDataPermissions,
        permission_tables: prevDataPermissions.permission_tables?.map((d) => {
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

  const handleAddUserRowFilterValues = (
    permission_table_id: string | undefined,
    rowFilter: string,
    rowFilterValues: PermissionGroupDataPermissionsPermissionTable["row_filters"][number]["values"],
  ) => {
    setFormDataPermissions((prevDataPermissions) => {
      return {
        ...prevDataPermissions,
        permission_tables: prevDataPermissions.permission_tables?.map((d) => {
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

  const handleSaveGroupDataPermissions = async () => {
    try {
      setLoading(true);
      const domains = formDataPermissions.domains.map((domain) => ({
        id: domain.id,
        classifications: domain.classifications.map((c) => c._id),
      }));

      const permission_tables: EditPermissionGroupPermissionsDto["permission_tables"] = formDataPermissions.permission_tables.map(
        (permissionTable) => ({
          id: permissionTable.id,
          row_filters: permissionTable.row_filters.map((row_filter) => ({
            kod: row_filter.kod,
            values: row_filter.values.map(({ value }) => value),
          })),
        }),
      );

      const data: EditPermissionGroupPermissionsDto = {
        attributes: formDataPermissions.attributes,
        domains,
        permission_tables,
      };

      const updatedData = await editPermissionGroupsDataPermissions(permissionGroup._id, data);

      queryClient.setQueryData(["permissionGroups", permissionGroup._id, "data-permissions"], updatedData);
      queryClient.invalidateQueries({ queryKey: ["permissionGroups", permissionGroup._id, "data-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["paginatedUsers"] });
      setSnackbarSuccess("ההרשאות נשמרו בהצלחה");
    } catch {
      setSnackbarError("שגיאה בעת שמירת ההרשאות");
    } finally {
      setLoading(false);
      setIsSavePopupOpen(false);
    }
  };

  if (!display) return <></>;

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="flex-end">
      <Grid container alignItems={"stretch"} sx={{ height: "93%" }} borderTop={GRID_BORDER_STYLE} borderBottom={GRID_BORDER_STYLE}>
        <Grid item xs={2} p={1}>
          <UserInfoCard elevation={0}>
            <CardContent sx={{ p: "1rem" }}>
              <UserAttribute
                title="בחירת התממה"
                attribute={formattedPermissionGroup.attributes.mask.value.toString()}
                handleSubmitAtrribue={(selectedAttribute) => {
                  return setFormDataPermissions((prevUser) => {
                    const mask = selectedAttribute === "true";

                    return {
                      ...prevUser,
                      attributes: { ...prevUser.attributes, mask },
                    };
                  });
                }}
                attributeOptions={MASK_OPTIONS}
                disabled={disabled || !hasPermissionsForMask}
                isLoading={permissionsForMaskLoading}
              />

              <UserAttribute
                title="בחירת אוכלוסיית נפטרים"
                attribute={formattedPermissionGroup.attributes.deceased_population.value.toString()}
                handleSubmitAtrribue={(selectedAttribute) => {
                  return setFormDataPermissions((prevUser) => {
                    const deceased_population = selectedAttribute === "true";

                    return {
                      ...prevUser,
                      attributes: {
                        ...prevUser.attributes,
                        deceased_population,
                      },
                    };
                  });
                }}
                attributeOptions={DECEASED_POPULATION_OPTIONS}
                disabled={disabled || !hasPermissionsForDeceasedPopulations}
                isLoading={deceasedPopulationsLoading}
              />
            </CardContent>
          </UserInfoCard>
        </Grid>
        <Grid item xs={5} borderLeft={GRID_BORDER_STYLE} pt={1} height="100%">
          <UserDomains
            userDomains={formattedPermissionGroup.domains}
            domainsOptions={domainsOptions}
            domainsOptionsMap={domainsOptionsMap}
            handleDeleteDomain={handleDeleteDomain}
            handleAddDomains={(test) => handleAddDomains(test)}
            handleDeleteClassifications={handleDeleteUserClassifications}
            handleSaveClassifications={handleSaveUserClassifications}
            disableEdit={disabled}
          />
        </Grid>
        <Grid item xs={5} borderLeft={GRID_BORDER_STYLE} borderRight={GRID_BORDER_STYLE} pt={1} height="100%" bgcolor={"#f2f3fc"}>
          <Box
            sx={{
              overflow: "auto",
              height: "100%",
              maxHeight: "100%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#f2f3fc",
            }}
          >
            <UserPermissionTables
              userPermissionTables={formDataPermissions.permission_tables}
              mergedPermissionTables={formattedPermissionGroup.permission_tables}
              handleAddUserRowFilterValue={handleAddUserRowFilterValues}
              handleDeleteRowFilterValue={handleDeleteUserRowFilterValue}
              setUserRowFilterValues={setUserRowFilterValues}
              setUserPermissionTables={setUserPermissionTables}
              userDomains={formattedPermissionGroup.domains}
              disableEdit={disabled}
            />
          </Box>
        </Grid>
      </Grid>
      {isSavePopupOpen && (
        <SaveDataPermissionsPopup
          type="permission_group"
          name={permissionGroup.name}
          open={isSavePopupOpen}
          onClose={() => setIsSavePopupOpen(false)}
          handleSave={handleSaveGroupDataPermissions}
          changedAttributes={changedAttributes}
          permissionTablesDiff={permissionTablesDiff}
          domainsDiff={domainsDiff}
        />
      )}
      <Box height="8%" display="flex" alignItems="flex-end" mr={2}>
        <Button variant="contained" onClick={() => setIsSavePopupOpen(true)} disabled={disabled || !isDataPermissionsChanged}>
          שמירה
        </Button>
      </Box>
    </Box>
  );
};

export default DataPermissionsForm;
