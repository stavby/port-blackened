import { getPermissionTablesOptions } from "@api/users";
import { USER_PERMISSION_TABLES_OPTIONS_ENDPOINT } from "@constants/index";
import { formatNonDirectSources, getNonDirectSources, hasNonDirectSources } from "@helpers/permissionSources";
import { Backdrop, Box, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { CreateUserDto } from "@port/shield-schemas";
import { useQuery } from "@tanstack/react-query";
import { UserPermissionTable, UserPermissionTableDto, UserRowFilter, UserRowFilterValue, UserRowFilterValueDto } from "@types";
import { useEffect, useState } from "react";
import { TUserDomainListItem } from "../UserDomains";
import { CountChipStyled } from "../UserDomains/UserDomains.style";
import { EditUserAttributePopup } from "../UserInfo/EditUserAttributePopup";
import { AttributeOptions } from "../UserInfo/types";
import AddRowFilterValuesPopup from "./AddRowFiltersPopup";
import { NoPermissionTables } from "./NoPermissionTables";
import UserPermissionTableAccordion from "./UserPermissionTableAccordion";

const booleanAttributesOptions = [
  { key: 0, label: "לא" },
  { key: 1, label: "כן" },
] as const satisfies AttributeOptions[];

export interface SelectedRowFilter {
  permissionTableId: UserPermissionTable["id"];
  data: UserRowFilter;
}

export interface UserPermissionTablesProps {
  userPermissionTables: UserPermissionTableDto[];
  mergedPermissionTables: UserPermissionTable[];
  userDomains: TUserDomainListItem[];
  handleDeleteRowFilterValue: (
    permission_table_id: UserPermissionTable["id"],
    rowFilterKod: UserRowFilter["kod"],
    values: UserRowFilterValue["value"][],
  ) => void;
  setUserPermissionTables: (userPermissionTables: UserPermissionTableDto[]) => void;
  handleAddUserRowFilterValue: (permission_table_id: string, rowFilterKod: string, rowFilterValues: UserRowFilterValueDto[]) => void;
  setUserRowFilterValues: (permission_table_id: string, rowFilterKod: string, newRowFilterValues: UserRowFilterValueDto[]) => void;
  disableEdit?: boolean;
}

const UserPermissionTables = ({
  userPermissionTables,
  mergedPermissionTables,
  userDomains,
  handleDeleteRowFilterValue,
  setUserRowFilterValues,
  setUserPermissionTables,
  disableEdit,
}: UserPermissionTablesProps) => {
  const [isAttributePopupOpen, setIsAttributePopupOpen] = useState(false);
  const [selectedRowFilter, setSelectedRowFilter] = useState<SelectedRowFilter | null>(null);

  const {
    data: permissionTableOptions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [USER_PERMISSION_TABLES_OPTIONS_ENDPOINT, userDomains],
    queryFn: async () => {
      const formattedUserDomains = userDomains.map<CreateUserDto["domains"][number]>((domain) => ({
        id: domain.id,
        classifications: domain.classifications.map((classification) => classification._id),
      }));

      return await getPermissionTablesOptions(formattedUserDomains);
    },
    meta: {
      loading: false,
    },
  });

  useEffect(() => {
    if (permissionTableOptions) {
      const permissionTableOptionsMap = new Map(permissionTableOptions.map((permissionTable) => [permissionTable.id, permissionTable]));
      const userPermissionTableIds = new Set(userPermissionTables.map((userPermissionTable) => userPermissionTable.id));
      const newPermissionTables: UserPermissionTableDto[] = [];

      for (const item of userPermissionTables) {
        if (permissionTableOptionsMap.has(item.id)) {
          newPermissionTables.push(item);
        }
      }

      for (const item of permissionTableOptions) {
        if (!userPermissionTableIds.has(item.id)) {
          newPermissionTables.unshift(item);
        }
      }

      setUserPermissionTables(newPermissionTables);
    }
    // should only run when permissionTableOptions is changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionTableOptions]);

  const handleOpenPopup = (rowFilter: SelectedRowFilter) => {
    setSelectedRowFilter(rowFilter);
    setIsAttributePopupOpen(true);
  };

  return (
    <>
      <Box sx={{ p: 2, backgroundColor: "#f2f3fc" }}>
        <Stack direction={"row"} spacing={1} sx={{ alignItems: "center", paddingBottom: 1.5 }}>
          <CountChipStyled label={mergedPermissionTables.length} />
          <Typography sx={{ fontWeight: "bold" }}>טבלאות סינון</Typography>
        </Stack>
        <Divider />
      </Box>
      <Box position="relative" flexGrow={1}>
        <Backdrop
          open={isLoading}
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1000, position: "absolute", background: "rgba(0, 0, 0, 0.2)" }}
        >
          <CircularProgress size="100px" />
        </Backdrop>
        {isError ? (
          <Typography color="red">שגיאה בעת טעינת טבלאות הסינון</Typography>
        ) : mergedPermissionTables.length === 0 ? (
          <NoPermissionTables />
        ) : (
          mergedPermissionTables.map((permissionTable, index) => (
            <UserPermissionTableAccordion
              key={permissionTable.id}
              isFirst={index === 0}
              permissionTable={permissionTable}
              handleOpenPopupRowFilterPopup={handleOpenPopup}
              handleDeleteRowFilterValue={handleDeleteRowFilterValue}
              disableEdit={disableEdit}
            />
          ))
        )}
      </Box>

      {isAttributePopupOpen &&
        selectedRowFilter &&
        (selectedRowFilter.data.type === "boolean" ? (
          <EditUserAttributePopup
            open={isAttributePopupOpen}
            onClose={() => setIsAttributePopupOpen(false)}
            attributeOptions={booleanAttributesOptions}
            defaultAttribute={selectedRowFilter.data.values[0]?.value ?? booleanAttributesOptions[0].key}
            disabled={hasNonDirectSources(selectedRowFilter.data.values[0]?.sources ?? [])}
            title={`לאשר אוכלוסיית ${selectedRowFilter.data.display_name}?`}
            handleSubmitAtrribue={(selectedAttribute) => {
              const selectedAttributeOption = booleanAttributesOptions.find(
                (option) => option.key.toString() === selectedAttribute.toString(),
              );

              if (selectedAttributeOption) {
                setUserRowFilterValues(selectedRowFilter.permissionTableId, selectedRowFilter.data.kod, [
                  {
                    value: selectedAttributeOption.key,
                    display_name: selectedAttributeOption.label,
                  },
                ]);
              }
              setIsAttributePopupOpen(false);
            }}
            helperText={formatNonDirectSources(getNonDirectSources(selectedRowFilter.data.values[0]?.sources ?? []))}
          />
        ) : (
          <AddRowFilterValuesPopup
            open
            permissionTableId={selectedRowFilter.permissionTableId}
            queryBuilderType={selectedRowFilter.data.query_builder_type}
            rowFilterKod={selectedRowFilter.data.kod}
            onClose={() => setIsAttributePopupOpen(false)}
            initialRowFilterValues={selectedRowFilter.data.values}
            handleSave={(newRowFilterValues) => {
              setUserRowFilterValues(selectedRowFilter.permissionTableId, selectedRowFilter.data.kod, newRowFilterValues);
            }}
          />
        ))}
    </>
  );
};

export default UserPermissionTables;
