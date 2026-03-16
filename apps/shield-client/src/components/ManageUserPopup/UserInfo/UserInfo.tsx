import { useLoggedUserInfo } from "@api/auth";
import { getPermissionGroupsDataPermissions, useGetPermissionGroups } from "@api/permissionGroups";
import {
  useHasPermissionsForDeceasedPopulations,
  useHasPermissionsForMask,
  useHasPermissionsForUniquePopulations,
  useUniquePopulationOptions,
} from "@api/users";
import { UsersAutocomplete } from "@components/CardUser";
import StyledTooltip from "@components/Tooltip";
import { SAP_INDICATION_TOOLTIP } from "@helpers/constants";
import { formatNonDirectSources, getNonDirectSources } from "@helpers/permissionSources";
import { toFullName } from "@helpers/toFullName";
import { Box, CardContent, CardHeader, IconButton, Typography } from "@mui/material";
import { CirclesThreePlus, UserCircle } from "@phosphor-icons/react";
import { ObjectIdBrand } from "@port/shield-schemas";
import { useSnackBarStore } from "@store/snackbarStore";
import { GetUserInfoDto, MergedClientUser, UserDto, UserPermissionGroupDto } from "@types";
import { Dispatch, MouseEvent, useMemo, useState } from "react";
import { AddUserPermissionGroupsPopover } from "../PermissionGroups/AddUserPermissionGroupsPopover";
import { UserAttribute } from "./UserAttribute";
import { StackStyled, UserInfoCard } from "./UserInfo.styles";
import { UserInfoTrino } from "./UserInfoTrino";
import { DECEASED_POPULATION_OPTIONS, INITIAL_EMPTY_USER, MASK_OPTIONS, READ_ALL_OPTIONS, USER_TYPES_OPTIONS } from "./constants";
import { SapLogo } from "@assets/images/SapLogo";

type Props = {
  user: MergedClientUser;
  setUser: Dispatch<React.SetStateAction<UserDto>>;
  isSearchingMode: boolean;
  handleChangeUser: (selectedUser: GetUserInfoDto | null) => void;
  onPermissionGroupDataPermissionsFetchStart: () => void;
  onPermissionGroupDataPermissionsFetchEnd: () => void;
};

export const UserInfo = ({
  user,
  setUser,
  isSearchingMode,
  handleChangeUser,
  onPermissionGroupDataPermissionsFetchStart,
  onPermissionGroupDataPermissionsFetchEnd,
}: Props) => {
  const { data: loggedUser } = useLoggedUserInfo();

  const domainIds = useMemo(() => {
    return user.domains.map((domain) => domain.id);
  }, [user.domains]);
  const { data: hasPermissionsForMask, isLoading: permissionsForMaskLoading } = useHasPermissionsForMask(domainIds);
  const { data: hasPermissionsForUniquePopulations, isLoading: uniquePopulationsLoading } = useHasPermissionsForUniquePopulations();
  const { data: uniquePopulationOptions, isLoading: isUniqueOptionsLoading } = useUniquePopulationOptions({
    enabled: hasPermissionsForUniquePopulations,
  });
  const { data: hasPermissionsForDeceasedPopulations, isLoading: deceasedPopulationsLoading } =
    useHasPermissionsForDeceasedPopulations(domainIds);
  const [openPopover, setOpenPopover] = useState(false);

  const [anchorEl, setAnchorEL] = useState<HTMLButtonElement | null>(null);
  const { data: permissionsGroupsOptions } = useGetPermissionGroups();
  const handleOpenAddPopup = (event: MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(true);
    setAnchorEL(event.currentTarget);
  };

  const setSnackbarError = useSnackBarStore((state) => state.setSnackbarError);

  const handleUpdatePermissionsGroups = async (permission_groups: ObjectIdBrand[]) => {
    if (!permissionsGroupsOptions) return;
    try {
      onPermissionGroupDataPermissionsFetchStart();
      const permissionGroupsdataPermissions = await getPermissionGroupsDataPermissions(permission_groups);

      if (permissionGroupsdataPermissions.length !== permission_groups.length) {
        return;
      }

      const permissionGroups = permission_groups.map<UserPermissionGroupDto>((group) => {
        const dataPermissions = permissionGroupsdataPermissions.find(({ _id }) => _id === group)!;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const domains = dataPermissions.domains.map(({ given_by, last_changed_by, last_change, create_date, ...rest }) => rest);
        const option = permissionsGroupsOptions.find(({ _id }) => _id === group)!;

        return {
          ...dataPermissions,
          name: option.name,
          color: option.color,
          domains,
        };
      });

      setUser((prevUser) => ({
        ...prevUser,
        permission_groups: permissionGroups ?? prevUser.permission_groups,
      }));
    } catch {
      setSnackbarError("השגת הרשאות הקבוצות שבחרת נכשלה");
    } finally {
      onPermissionGroupDataPermissionsFetchEnd();
    }
  };

  const maskNonDirectSources = getNonDirectSources(user.attributes.mask.sources);
  const deceasedPopulationsNonDirectSources = getNonDirectSources(user.attributes.deceased_population.sources);

  return (
    <UserInfoCard elevation={0}>
      <CardHeader
        sx={{ backgroundColor: "#e5e7f9" }}
        title={
          isSearchingMode ? (
            <UsersAutocomplete onUserSelect={handleChangeUser} />
          ) : (
            <StackStyled alignItems={"center"} direction={"row"}>
              <UserCircle size={32} weight="duotone" className="userIcon" />
              <Typography sx={{ fontWeight: "bold", mx: 1 }}>{user.user_id}</Typography>
              <Typography>{toFullName(user)}</Typography>
              {user.is_sap_permitted && (
                <StyledTooltip title={<Typography sx={{ direction: "ltr" }}>{SAP_INDICATION_TOOLTIP}</Typography>}>
                  <Box display="inline-flex" alignItems="flex-end">
                    <SapLogo />
                  </Box>
                </StyledTooltip>
              )}
              <IconButton onClick={handleOpenAddPopup}>
                <CirclesThreePlus size={24} color="blue" style={{ transform: "rotate(270deg)" }} />
              </IconButton>
              {openPopover && (
                <AddUserPermissionGroupsPopover
                  open={openPopover}
                  onClose={() => setOpenPopover(false)}
                  handleSave={handleUpdatePermissionsGroups}
                  permissionGroupsOptions={permissionsGroupsOptions ?? []}
                  anchorEL={anchorEl}
                  user={user}
                />
              )}
            </StackStyled>
          )
        }
      />
      {!isSearchingMode &&
        !uniquePopulationsLoading &&
        !deceasedPopulationsLoading &&
        !permissionsForMaskLoading &&
        user.user_id !== INITIAL_EMPTY_USER.user_id && (
          <CardContent sx={{ p: "1rem" }}>
            <UserAttribute
              title="בחירת סוג משתמש"
              key={user.attributes.type}
              attribute={user.attributes.type}
              handleSubmitAtrribue={(selectedAttribute) => {
                const type = selectedAttribute as MergedClientUser["attributes"]["type"];
                return setUser((prevUser) => ({
                  ...prevUser,
                  attributes: { ...prevUser.attributes, type: type },
                }));
              }}
              attributeOptions={USER_TYPES_OPTIONS}
            />
            <UserAttribute
              title="בחירת התממה"
              attribute={user.attributes.mask.value.toString()}
              handleSubmitAtrribue={(selectedAttribute) => {
                return setUser((prevUser) => {
                  const mask = selectedAttribute === "true";

                  return {
                    ...prevUser,
                    attributes: { ...prevUser.attributes, mask },
                  };
                });
              }}
              attributeOptions={MASK_OPTIONS}
              helperText={maskNonDirectSources.length > 0 ? formatNonDirectSources(maskNonDirectSources) : undefined}
              disabled={!hasPermissionsForMask || maskNonDirectSources.length > 0}
              isLoading={permissionsForMaskLoading}
            />
            {hasPermissionsForUniquePopulations && (
              <UserAttribute
                title="בחירת אוכלוסיות מיוחדות"
                attribute={user.attributes.unique_population}
                handleSubmitAtrribue={(selectedAttribute) => {
                  return setUser((prevUser) => {
                    return {
                      ...prevUser,
                      attributes: {
                        ...prevUser.attributes,
                        unique_population: selectedAttribute,
                      },
                    };
                  });
                }}
                attributeOptions={(uniquePopulationOptions ?? []).map(({ id, name }) => ({ key: id, label: name }))}
                isLoading={uniquePopulationsLoading || isUniqueOptionsLoading}
              />
            )}
            <UserAttribute
              title="בחירת אוכלוסיית נפטרים"
              attribute={user.attributes.deceased_population.value.toString()}
              handleSubmitAtrribue={(selectedAttribute) => {
                return setUser((prevUser) => {
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
              helperText={
                deceasedPopulationsNonDirectSources.length > 0 ? formatNonDirectSources(deceasedPopulationsNonDirectSources) : undefined
              }
              disabled={!hasPermissionsForDeceasedPopulations || deceasedPopulationsNonDirectSources.length > 0}
              isLoading={deceasedPopulationsLoading}
            />
            {loggedUser?.isAdmin && (
              <UserAttribute
                title="בחירת Read All"
                attribute={(!!user.is_read_all).toString()}
                handleSubmitAtrribue={(selectedAttribute) => {
                  return setUser((prevUser) => {
                    const is_read_all = selectedAttribute === "true";

                    return {
                      ...prevUser,
                      is_read_all,
                    };
                  });
                }}
                attributeOptions={READ_ALL_OPTIONS}
              />
            )}
            {<UserInfoTrino user_id={user.user_id} />}
          </CardContent>
        )}
    </UserInfoCard>
  );
};
