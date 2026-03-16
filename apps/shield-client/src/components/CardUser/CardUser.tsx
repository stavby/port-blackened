import { useLoggedUserInfo } from "@api/auth";
import { cloneUsers, deleteUserById, useHasPermissionsForUniquePopulations } from "@api/users";
import PreviewPopup from "@components/ManageUserPopup/Preview/PreviewPopup";
import StyledTooltip from "@components/Tooltip";
import { useLoadingContext } from "@contexts/Loading";
import { SAP_INDICATION_TOOLTIP } from "@helpers/constants";
import { toFullName } from "@helpers/toFullName";
import { useCalculateOverFlowItems } from "@helpers/useCalculateOverFlowItems";
import { mergeUserDto, removeUserFromCache, updateUserInCache } from "@helpers/users";
import { ContentCopyOutlined, DeleteOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Avatar, Box, CardActions, CardContent, CardHeader, Chip, Grid, Skeleton, Typography } from "@mui/material";
import { PencilSimple, UserCircle } from "@phosphor-icons/react";
import { useSnackBarStore } from "@store";
import { useQueryClient } from "@tanstack/react-query";
import { Domain, GetUserInfoDto, MergedClientUser, UserDto } from "@types";
import { Dispatch, ReactNode, SetStateAction, useMemo, useRef, useState } from "react";
import { CardUserHeaderChip, CopyPermissionPopup, TableUser, UserProfileTooltip } from ".";
import { ManageUserPopUp, WarningDeletePopup } from "..";
import { CardUserHeaderActionIcon, CardUserHeaderChipGroups, StyledCardUser } from "./CardUser.style";
import { SummeryCopyPermissionPopup } from "./SummeryCopyPermissionPopup";
import { SapLogo } from "@assets/images/SapLogo";

type CardUserTemplateProps = {
  cardHeaderAvatar: ReactNode;
  cardHeaderTitle: ReactNode;
  cardContent: ReactNode;
  cardHeaderAction?: ReactNode;
};

export const CardUserTemplate = ({ cardHeaderAvatar, cardHeaderTitle, cardContent, cardHeaderAction }: CardUserTemplateProps) => (
  <StyledCardUser variant="outlined">
    <CardHeader
      avatar={cardHeaderAvatar}
      title={cardHeaderTitle}
      action={cardHeaderAction}
      sx={{
        height: "60px",
      }}
    />
    <CardContent sx={{ padding: "0px" }}>{cardContent}</CardContent>
    <CardActions sx={{ display: "contents" }} />
  </StyledCardUser>
);

export const CardUserSkeleton = () => (
  <CardUserTemplate
    cardHeaderAvatar={
      <Skeleton variant="circular">
        <Avatar />
      </Skeleton>
    }
    cardHeaderTitle={<Skeleton variant="rectangular" width="200px" />}
    cardContent={<Skeleton variant="rectangular" width="auto" height="160px" />}
  />
);

export type CopyToUserType = GetUserInfoDto;

const filterUserAllowedDomains = (sourceUser: UserDto, domainsOptionsMap: Map<string, Domain>) => {
  const allowedDomains = sourceUser.domains.filter((domain) => {
    const loggedUserDomain = domainsOptionsMap.get(domain.id);

    return (
      !!loggedUserDomain &&
      domain.classifications.every((classification) =>
        loggedUserDomain.classifications.some((loggedUserClassfication) => loggedUserClassfication === classification._id),
      )
    );
  });

  return allowedDomains;
};

type CardUserProps = {
  userDto: UserDto;
  domainsOptions: Domain[];
  domainsOptionsMap: Map<string, Domain>;
};

export const CardUser = ({ userDto, domainsOptions, domainsOptionsMap }: CardUserProps) => {
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openCopy, setOpenCopy] = useState<boolean>(false);
  const [openPreview, setOpenPreview] = useState<boolean>(false);
  const [openCopyConfirm, setOpenCopyConfirm] = useState<boolean>(false);
  const [copyToUsers, setCopyToUsers] = useState<CopyToUserType[]>([]);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const { setSnackbarSuccess, setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));
  const { setLoading } = useLoadingContext();
  const { data: loggedUser } = useLoggedUserInfo();

  const allowedDomains = useMemo(() => filterUserAllowedDomains(userDto, domainsOptionsMap), [userDto, domainsOptionsMap]);
  const mergedUser = useMemo(() => mergeUserDto(userDto), [userDto]);

  const handleConfirmCopy = async (validDestinationUsers: CopyToUserType[]) => {
    try {
      setLoading(true);
      const validDestinationUsersIds = validDestinationUsers.map(({ user_id }) => user_id);

      await cloneUsers(userDto.user_id, validDestinationUsersIds);

      queryClient.invalidateQueries({ queryKey: ["paginatedUsers"] });
      setSnackbarSuccess("ההרשאה הועתקה בהצלחה");
    } catch {
      setSnackbarError("שגיאה בעת העתקת הרשאה");
    } finally {
      setCopyToUsers([]);
      setOpenCopy(false);
      setOpenCopyConfirm(false);
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);

      await deleteUserById(mergedUser._id);
      removeUserFromCache(queryClient, mergedUser.user_id);
      queryClient.invalidateQueries({ queryKey: ["paginatedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["user", "getUsersByPermissionGroup"] });

      setSnackbarSuccess("ההרשאה נמחקה בהצלחה");
    } catch (error) {
      setSnackbarError("שגיאה בעת מחיקת הרשאה", error);
    } finally {
      setOpenDelete(false);
      setLoading(false);
    }
  };

  return (
    <>
      {openEdit && (
        <ManageUserPopUp
          openModal={openEdit}
          setOpenModal={setOpenEdit}
          editedUser={userDto}
          handleChangeEditedUser={(newUser) => {
            updateUserInCache(queryClient, newUser);
            queryClient.invalidateQueries({ queryKey: ["paginatedUsers"] });
          }}
          domainsOptions={domainsOptions}
          domainsOptionsMap={domainsOptionsMap}
        />
      )}
      {openPreview && <PreviewPopup openModal={openPreview} setOpenModal={setOpenPreview} type="current" userId={mergedUser.user_id} />}
      <CopyPermissionPopup
        openCopy={openCopy}
        onClose={() => {
          setOpenCopy(false);
          setCopyToUsers([]);
        }}
        copyToUsers={copyToUsers}
        setCopyToUsers={setCopyToUsers}
        user={userDto}
        handleConfirmCopy={() => setOpenCopyConfirm(true)}
      />
      {openCopyConfirm && (
        <SummeryCopyPermissionPopup
          open={openCopyConfirm}
          setOpen={setOpenCopyConfirm}
          copyToUsers={copyToUsers}
          allowedDomains={allowedDomains}
          copyFromUser={userDto}
          handleConfirmCopy={handleConfirmCopy}
        />
      )}
      <WarningDeletePopup
        openDelete={openDelete}
        setOpenDelete={setOpenDelete}
        handleConfirmDelete={handleConfirmDelete}
        title={`מחיקת משתמש ${toFullName(mergedUser, mergedUser.user_id)}`}
      />
      <CardUserTemplate
        cardHeaderAvatar={<CardHeaderAvatar user_id={mergedUser.user_id} userType={mergedUser.attributes.type} />}
        cardHeaderTitle={
          <CardHeaderTitle
            type="user"
            attributes={mergedUser.attributes}
            user_id={mergedUser.user_id}
            first_name={mergedUser.first_name}
            last_name={mergedUser.last_name}
            isSapPermitted={mergedUser.is_sap_permitted}
            permission_groups={mergedUser.permission_groups}
          />
        }
        cardHeaderAction={
          <CardHeaderAction
            setOpenEdit={setOpenEdit}
            setOpenPreview={setOpenPreview}
            {...(allowedDomains.length > 0 ? { setOpenCopy } : {})}
            {...(loggedUser?.isAdmin ? { setOpenDelete } : {})}
          />
        }
        cardContent={
          <>
            <TableUser user={userDto} mergedUser={mergedUser} domainsOptions={domainsOptions} domainsOptionsMap={domainsOptionsMap} />
            <CardActions sx={{ display: "contents" }} />
          </>
        }
      />
    </>
  );
};

const CardHeaderAvatar = ({ user_id, userType }: { user_id: string; userType: MergedClientUser["attributes"]["type"] }) => (
  <UserProfileTooltip user_id={user_id} disabled={userType === "מערכת"}>
    <Typography sx={{ display: "flex", alignItems: "center" }}>
      <UserCircle size={34} color={"#3255DF"} weight="duotone" />
    </Typography>
  </UserProfileTooltip>
);

type CardHeaderTitlePropsCommon = {
  attributes: Partial<MergedClientUser["attributes"]>;
};

export type CardHeaderTitleProps =
  | ({
      type: "user";
      user_id: MergedClientUser["user_id"] | undefined;
      first_name: MergedClientUser["first_name"];
      last_name: MergedClientUser["last_name"];
      isSapPermitted?: MergedClientUser["is_sap_permitted"];
      permission_groups: (MergedClientUser["permission_groups"][number] & { isDeleted?: boolean })[];
    } & CardHeaderTitlePropsCommon)
  | ({
      type: "permission_group";
      name: string;
    } & CardHeaderTitlePropsCommon);

export const CardHeaderTitle = (props: CardHeaderTitleProps) => {
  const { data: hasPermissionsForUniquePopulations } = useHasPermissionsForUniquePopulations();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overflowCount = useCalculateOverFlowItems(containerRef, props.type === "user" ? props.permission_groups : []);

  return (
    <Box
      sx={{
        fontSize: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {props.type === "user" ? (
        <>
          <span style={{ marginLeft: "6px", fontWeight: "bold", color: "#475467" }}>
            {toFullName(props, props.attributes.type === "מערכת" ? "" : "פרטי משתמש לא נמצאו")}
          </span>
          <span style={{ marginLeft: "20px", fontWeight: "bold" }}>{props.user_id}</span>
          <div style={{ marginLeft: "20px", display: "flex", alignItems: "center" }}>
            {props.isSapPermitted && (
              <StyledTooltip title={<Typography sx={{ direction: "ltr" }}>{SAP_INDICATION_TOOLTIP}</Typography>}>
                <Box display="inline-flex" alignItems="flex-end">
                  <SapLogo />
                </Box>
              </StyledTooltip>
            )}
          </div>
        </>
      ) : (
        <span style={{ marginLeft: "6px", fontWeight: "bold", color: "#475467" }}>{props.name}</span>
      )}
      {props.attributes.type !== undefined && <CardUserHeaderChip variant="outlined" key="type" label={props.attributes.type} />}
      {props.attributes.mask !== undefined && (
        <CardUserHeaderChip variant="outlined" key="mask" label={props.attributes.mask.value ? "נתונים מותממים" : "ללא התממה"} />
      )}
      {props.attributes.unique_population !== undefined && !!hasPermissionsForUniquePopulations && (
        <CardUserHeaderChip
          variant="outlined"
          key="unique_population"
          label={props.attributes.unique_population.length > 0 ? "מציג אוכלוסיות מיוחדות" : "ללא אוכלוסיות מיוחדות"}
        />
      )}
      {props.attributes.deceased_population !== undefined && (
        <CardUserHeaderChip
          variant="outlined"
          key="deceased_population"
          label={props.attributes.deceased_population.value ? "מציג נפטרים" : "ללא נפטרים"}
        />
      )}
      {props.type === "user" && (
        <Box display="flex">
          <Grid container maxWidth={"800px"}>
            <Grid xs={12} item height={"0px"} display={"flex"} sx={{ overflowX: "hidden", height: "0px" }}>
              <Box
                maxWidth={"90%"}
                display="flex"
                height="0px"
                columnGap={1}
                sx={{
                  overflowX: "hidden",
                }}
                ref={containerRef}
              >
                {props.permission_groups.map((group) => (
                  <CardUserHeaderChipGroups
                    variant="outlined"
                    key={group._id}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box bgcolor={group.color} height={8} width={8} borderRadius={9999} />
                        {group.name}
                      </Box>
                    }
                    sx={{ ...(group.isDeleted && { textDecoration: "line-through" }), height: "0px" }}
                  />
                ))}
              </Box>
            </Grid>
            <Box display={"flex"}>
              {props.permission_groups.slice(0, props.permission_groups.length - overflowCount).map((group) => (
                <CardUserHeaderChipGroups
                  variant="outlined"
                  key={group._id}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box bgcolor={group.color} height={8} width={8} borderRadius={9999} />
                      {group.name}
                    </Box>
                  }
                  sx={{ ...(group.isDeleted && { textDecoration: "line-through" }) }}
                />
              ))}
            </Box>
            {overflowCount > 0 && (
              <StyledTooltip
                title={
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    py={1}
                    gap={1}
                    flexWrap="wrap"
                    maxWidth="20vw"
                    bgcolor="inherit"
                    borderRadius="inherit"
                  >
                    {props.permission_groups.slice(props.permission_groups.length - overflowCount).map((group) => (
                      <CardUserHeaderChipGroups
                        variant="outlined"
                        key={group._id}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            {group.name}
                            <Box bgcolor={group.color} height={8} width={8} borderRadius={9999} />
                          </Box>
                        }
                        sx={{ ...(group.isDeleted && { textDecoration: "line-through" }) }}
                      />
                    ))}
                  </Box>
                }
              >
                <Chip
                  variant="outlined"
                  label={`+${overflowCount}`}
                  sx={{
                    padding: 0,
                    border: "1px solid #667085",
                    backgroundColor: "#F2F4F7",
                  }}
                />
              </StyledTooltip>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

type CardHeaderActionProps = {
  setOpenEdit?: Dispatch<SetStateAction<boolean>>;
  setOpenCopy?: Dispatch<SetStateAction<boolean>>;
  setOpenDelete?: Dispatch<SetStateAction<boolean>>;
  setOpenPreview?: Dispatch<SetStateAction<boolean>>;
};

const CardHeaderAction = ({ setOpenEdit, setOpenCopy, setOpenDelete, setOpenPreview }: CardHeaderActionProps) => (
  <>
    <CardUserHeaderActionIcon
      disabled={!setOpenPreview}
      onClick={() => {
        setOpenPreview?.(true);
      }}
    >
      <VisibilityOutlined sx={{ color: "#475467", width: 20, height: 20, opacity: setOpenPreview ? 1 : 0.5 }} />
    </CardUserHeaderActionIcon>

    <CardUserHeaderActionIcon
      disabled={!setOpenEdit}
      onClick={() => {
        setOpenEdit?.(true);
      }}
    >
      <PencilSimple weight="bold" color="#475467" size={20} opacity={setOpenEdit ? 1 : 0.5} />
    </CardUserHeaderActionIcon>

    <CardUserHeaderActionIcon
      disabled={!setOpenCopy}
      onClick={() => {
        setOpenCopy?.(true);
      }}
    >
      <ContentCopyOutlined sx={{ color: "#475467", width: 20, height: 20 }} opacity={setOpenCopy ? 1 : 0.5} />
    </CardUserHeaderActionIcon>

    <CardUserHeaderActionIcon
      disabled={!setOpenDelete}
      onClick={() => {
        setOpenDelete?.(true);
      }}
    >
      <DeleteOutlined sx={{ color: "#E14A5C", width: 20, height: 20 }} opacity={setOpenDelete ? 1 : 0.5} />
    </CardUserHeaderActionIcon>
  </>
);
