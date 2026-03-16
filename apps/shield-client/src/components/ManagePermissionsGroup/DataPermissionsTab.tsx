import { useDomainsManage } from "@api/domains";
import { useGetLoggedUserPermissionsOnGroup, usePermissionGroupDataPermissions } from "@api/permissionGroups";
import { PermissionGroupsDto } from "@port/shield-schemas";
import DataPermissionsForm from "./DataPermissionsForm";
import { Backdrop, Box, CircularProgress, Typography } from "@mui/material";

interface DataPermissionsTabProps {
  permissionGroup: PermissionGroupsDto;
  display: boolean;
}

const DataPermissionsTab = ({ permissionGroup, display }: DataPermissionsTabProps) => {
  const loggedUserPermissionsOnGroup = useGetLoggedUserPermissionsOnGroup(permissionGroup._id);
  const dataPermissionsQuery = usePermissionGroupDataPermissions(permissionGroup._id);
  const domainsOptionsQuery = useDomainsManage();

  if (domainsOptionsQuery.isError || dataPermissionsQuery.isError || loggedUserPermissionsOnGroup.isError) {
    return (
      <Box height="100%" width="100%" display="flex" justifyContent="center" alignItems="center">
        <Typography>אוי לא! נראה שהייתה שגיאה בשרת. נסה לרענן את העמוד</Typography>
      </Box>
    );
  }

  return (
    <>
      <Backdrop
        open={domainsOptionsQuery.isLoading || dataPermissionsQuery.isLoading || loggedUserPermissionsOnGroup.isLoading}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1000, position: "absolute", background: "rgba(0, 0, 0, 0.2)" }}
      >
        <CircularProgress size="100px" />
      </Backdrop>
      ;
      {domainsOptionsQuery.data && dataPermissionsQuery.data && loggedUserPermissionsOnGroup.data && (
        <DataPermissionsForm
          permissionGroup={permissionGroup}
          initialPermissionGroupDataPermissions={dataPermissionsQuery.data}
          domainsOptions={domainsOptionsQuery.data}
          disabled={!loggedUserPermissionsOnGroup.data.can_update_details}
          display={display}
        />
      )}
    </>
  );
};

export default DataPermissionsTab;
