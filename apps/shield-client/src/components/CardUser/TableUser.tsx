import UserFullNameTooltip from "@components/UserFullNameTooltip";
import { KeyboardDoubleArrowDown, KeyboardDoubleArrowUp, LanRounded } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid-pro";
import { formatDate } from "@port/utils";
import { Domain, MergedClientUser, UserDomain, UserDto } from "@types";
import { useState } from "react";
import { DataGridProComponent } from "..";
import ClassificationsChipsList from "./ClassificationsChipsList";
import { TableCellActions } from "./TableCellActions";
import { SHIELD_ROLE_NAME } from "@port/shield-schemas";
import { DIRECT_PERMISSION_SOURCE } from "@port/shield-utils";
import { StyledTooltip } from "@port/components/styledTooltip";

type PermissionModifierCellProps = {
  domain: UserDomain;
  modifierType: Extract<keyof UserDomain["sources"][number], "given_by" | "last_changed_by">;
};

const PermissionModifierCell = ({ domain, modifierType }: PermissionModifierCellProps) => {
  const permissionModifier =
    domain.sources.find((source) => source.id === DIRECT_PERMISSION_SOURCE.id)?.[modifierType] ?? domain.sources[0]?.[modifierType];

  if (!permissionModifier) {
    return <></>;
  }

  return (
    <>
      {typeof permissionModifier === "string" ? (
        <Box sx={{ display: "flex", alignContent: "center" }}>{permissionModifier}</Box>
      ) : (
        <Box display="flex" columnGap={0.5} alignItems="center">
          <UserFullNameTooltip user_id={permissionModifier.user_id}>
            <Box sx={{ display: "flex", alignContent: "center" }}>{permissionModifier.user_id}</Box>
          </UserFullNameTooltip>
          {permissionModifier.roles.some((role) => role.name === SHIELD_ROLE_NAME.api_user) && (
            <StyledTooltip title='ההרשאה ניתנה ע"י API' sx={{ direction: "ltr" }}>
              <LanRounded sx={{ color: "royalblue", fontSize: 16 }} />
            </StyledTooltip>
          )}
        </Box>
      )}
    </>
  );
};

type TableUserProps = {
  user: UserDto;
  mergedUser: MergedClientUser;
  domainsOptions: Domain[];
  domainsOptionsMap: Map<string, Domain>;
};

const COLLAPSED_ROWS_AMOUNT = 3;

export const TableUser = ({ user, mergedUser, domainsOptions, domainsOptionsMap }: TableUserProps) => {
  const [isCollapsedRows, setIsCollapsedRows] = useState<boolean>(false);
  const handleClickCollapseRow = () => setIsCollapsedRows((prevState) => !prevState);

  const innerUserColumns: GridColDef<UserDomain>[] = [
    {
      field: "display_name",
      headerName: "שם עולם תוכן",
      flex: 1,
      sortable: false,
    },
    {
      field: "classifications",
      headerName: "סווג",
      flex: 3,
      renderCell: (params: GridRenderCellParams<UserDomain>) => (
        <ClassificationsChipsList classifications={params.row.classifications} domainId={params.row.id} />
      ),

      sortable: false,
    },
    {
      field: "given_by",
      headerName: 'הרשאה ניתנה ע"י',
      flex: 1,
      sortable: false,
      renderCell: (params) => <PermissionModifierCell domain={params.row} modifierType="given_by" />,
    },
    {
      field: "create_date",
      headerName: "תאריך יצירה",
      flex: 1,
      renderCell: (params) => formatDate(params.row.sources[0]?.create_date),
      sortable: false,
    },
    {
      field: "last_changed_by",
      headerName: 'הרשאה עודכנה ע"י',
      flex: 1,
      sortable: false,
      renderCell: (params) => <PermissionModifierCell domain={params.row} modifierType="last_changed_by" />,
    },
    {
      field: "last_change",
      headerName: "תאריך שינוי אחרון",
      flex: 1,
      renderCell: (params) => formatDate(params.row.sources[0]?.last_change),
      sortable: false,
    },
    {
      field: "three-dots",
      headerName: "",
      flex: 0.2,
      renderCell: (params) => (
        <TableCellActions mergedDomain={params.row} userDto={user} domainsOptions={domainsOptions} domainsOptionsMap={domainsOptionsMap} />
      ),
      sortable: false,
    },
  ];

  return (
    <Box {...(mergedUser.domains.length === 0 ? { height: 150 } : {})}>
      <DataGridProComponent
        columns={innerUserColumns}
        rows={
          mergedUser.domains.length > COLLAPSED_ROWS_AMOUNT && !isCollapsedRows
            ? mergedUser.domains.slice(0, COLLAPSED_ROWS_AMOUNT)
            : mergedUser.domains
        }
        {...(mergedUser.domains.length > COLLAPSED_ROWS_AMOUNT
          ? {
              slots: {
                footer: () => (
                  <Box display="flex" borderTop="1px solid rgba(0, 0, 0, 0.12)" width="100%" justifyContent="center">
                    <IconButton onClick={handleClickCollapseRow} sx={{ p: 0.5 }}>
                      {isCollapsedRows ? <KeyboardDoubleArrowUp fontSize="small" /> : <KeyboardDoubleArrowDown fontSize="small" />}
                    </IconButton>
                  </Box>
                ),
              },
            }
          : {
              slots: {
                noRowsOverlay: () => (
                  <Box height="100%" display="flex" justifyContent="center" alignItems="center">
                    אין עולמות תוכן למשתמש
                  </Box>
                ),
              },
              hideFooter: true,
            })}
        disableColumnMenu
        getRowId={(row) => row.id}
      />
    </Box>
  );
};
