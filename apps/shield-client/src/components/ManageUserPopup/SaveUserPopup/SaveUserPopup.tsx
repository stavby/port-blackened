import DomainsIcon from "@assets/icons/DomainsIcon";
import TablesIcon from "@assets/icons/TablesIcon";
import { CardHeaderTitle, CardHeaderTitleProps } from "@components/CardUser";
import { GeneralPopup, WarningPopup } from "@components/Popup";
import { Box, Button, Divider, Grid } from "@mui/material";
import { Checks } from "@phosphor-icons/react";
import { DiffByType, SplitedDomainDiff } from "@port/shield-utils";
import { MergedClientUser } from "@types";
import { INITIAL_EMPTY_USER } from "../UserInfo/constants";
import { PermissionGroupDiff, PermissionTableDiff } from "../diff.utils";
import { SummaryDomain, SummaryPermissionTable, SummarySubtitle, SummaryTitle } from "./SummaryContent";
import { TUserDomainListItem } from "../UserDomains";
import { PermissionGroupsDto } from "@port/shield-schemas";

type SaveDataPermissionsPopupCommonProps = {
  open: boolean;
  changedAttributes: Partial<MergedClientUser["attributes"]>;
  domainsDiff: DiffByType<
    SplitedDomainDiff<
      string,
      Pick<TUserDomainListItem, "id" | "display_name" | "classifications">,
      Pick<TUserDomainListItem, "id" | "display_name" | "classifications">
    >
  >;
  permissionTablesDiff: DiffByType<PermissionTableDiff>;
  onClose: () => void;
  handleSave: () => void;
};

type SaveDataPermissionsPopupProps =
  | ({
      type: "user";
      permissionGroupDiff: PermissionGroupDiff;
      userData: Pick<MergedClientUser, "user_id" | "first_name" | "last_name" | "domains">;
    } & SaveDataPermissionsPopupCommonProps)
  | ({
      type: "permission_group";
      name: PermissionGroupsDto["name"];
    } & SaveDataPermissionsPopupCommonProps);

export default function SaveDataPermissionsPopup(props: SaveDataPermissionsPopupProps) {
  if (props.type === "user" && props.userData.user_id === INITIAL_EMPTY_USER.user_id) {
    return (
      <WarningPopup open={props.open} onClose={props.onClose}>
        <Box sx={{ overflowY: "auto", width: "35vh", maxHeight: "70vh" }}>יש לבחור משתמש לפי מספר אישי</Box>
      </WarningPopup>
    );
  }

  if (props.type === "user" && props.userData?.domains.length === 0) {
    return (
      <WarningPopup open={props.open} onClose={props.onClose}>
        <Box sx={{ overflowY: "auto", width: "40vh", maxHeight: "70vh" }}>על מנת לשמור משתמש יש להוסיף לפחות עולם תוכן אחד</Box>
      </WarningPopup>
    );
  }

  const cardHeaderTitleProps: CardHeaderTitleProps =
    props.type === "user"
      ? {
          type: "user",
          user_id: props.userData.user_id,
          first_name: props.userData.first_name,
          last_name: props.userData.last_name,
          attributes: props.changedAttributes,
          permission_groups: [
            ...props.permissionGroupDiff.newPermissionGroups,
            ...props.permissionGroupDiff.deletedPermissionGroups.map((group) => ({ ...group, isDeleted: true })),
          ],
        }
      : {
          type: "permission_group",
          name: props.name,
          attributes: props.changedAttributes,
        };

  return (
    <GeneralPopup
      open={props.open}
      onClose={props.onClose}
      title={<CardHeaderTitle {...cardHeaderTitleProps} />}
      titleIcon={
        <Checks
          color="#fff"
          fontSize={25}
          style={{
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
            backgroundColor: "#19B4A7",
          }}
        />
      }
      maxWidth={false}
      PaperProps={{
        style: {
          width: "70vw",
        },
      }}
    >
      <Box sx={{ overflowY: "auto", width: "100%", maxHeight: "100%", height: "70vh" }}>
        <Grid container alignItems={"stretch"} sx={{ height: "100%" }}>
          <Grid item xs={5.8} pt={1} height="100%">
            {props.domainsDiff.updated.length > 0 && (
              <Box sx={{ my: 1 }}>
                <SummaryTitle>עולמות תוכן שערכת:</SummaryTitle>
                {props.domainsDiff.updated.map((domain) => (
                  <SummaryDomain
                    key={`edited-domain-${domain.id}`}
                    displayName={domain.display_name}
                    newClassifications={domain.newClassifications}
                    deletedClassifications={domain.deletedClassifications}
                  />
                ))}
              </Box>
            )}
            {props.domainsDiff.new.length > 0 && (
              <Box sx={{ my: 1 }}>
                <SummaryTitle>עולמות תוכן שהוספת:</SummaryTitle>
                {props.domainsDiff.new.map((domain) => (
                  <SummaryDomain
                    key={`new-domain-${domain.id}`}
                    displayName={domain.display_name}
                    newClassifications={domain.classifications}
                  />
                ))}
              </Box>
            )}
            {props.domainsDiff.deleted.length > 0 && (
              <Box sx={{ my: 1 }}>
                <SummaryTitle>עולמות תוכן שמחקת:</SummaryTitle>
                {props.domainsDiff.deleted.map((domain) => (
                  <Box display="flex" alignItems="center" gap={0.5} key={domain.id}>
                    <DomainsIcon />
                    <SummarySubtitle>{domain.display_name}</SummarySubtitle>
                  </Box>
                ))}
              </Box>
            )}

            {!props.domainsDiff.deleted.length && !props.domainsDiff.new.length && !props.domainsDiff.updated.length && (
              <Box sx={{ my: 1, display: "flex", justifyContent: "center" }}>
                <SummaryTitle>שים לב, לא בוצעו שינויים בעולמות התוכן ובסיווגים</SummaryTitle>
              </Box>
            )}
          </Grid>
          <Grid item xs={0.4} display="flex" justifyContent="center">
            <Divider
              orientation="vertical"
              variant="middle"
              flexItem
              sx={{ backgroundColor: "gray", opacity: "20%", height: "90%", width: 2 }}
            />
          </Grid>
          <Grid item xs={5.8} pt={1} height="100%">
            {props.permissionTablesDiff.updated.length > 0 && (
              <Box sx={{ my: 1 }}>
                <SummaryTitle>טבלאות סינון שערכת:</SummaryTitle>
                {props.permissionTablesDiff.updated.map((permissionTable) => (
                  <SummaryPermissionTable key={`edited-permission-table-${permissionTable.id}`} userPermissionTable={permissionTable} />
                ))}
              </Box>
            )}
            {props.permissionTablesDiff.new.length > 0 && (
              <Box sx={{ my: 1 }}>
                <SummaryTitle>טבלאות סינון שהוספת:</SummaryTitle>
                {props.permissionTablesDiff.new.map((permissionTable) => (
                  <SummaryPermissionTable key={`new-permission-table-${permissionTable.id}`} userPermissionTable={permissionTable} />
                ))}
              </Box>
            )}
            {props.permissionTablesDiff.deleted.length > 0 && (
              <Box sx={{ my: 1 }}>
                <SummaryTitle>טבלאות סינון שמחקת:</SummaryTitle>
                {props.permissionTablesDiff.deleted.map((permissionTable) => (
                  <Box display="flex" alignItems="center" gap={0.5} key={permissionTable.id}>
                    <TablesIcon />
                    <SummarySubtitle>{permissionTable.display_name}</SummarySubtitle>
                  </Box>
                ))}
              </Box>
            )}

            {!props.permissionTablesDiff.deleted.length &&
              !props.permissionTablesDiff.new.length &&
              !props.permissionTablesDiff.updated.length && (
                <Box sx={{ my: 1, display: "flex", justifyContent: "center" }}>
                  <SummaryTitle>שים לב, לא בוצעו שינויים בטבלאות הסינון</SummaryTitle>
                </Box>
              )}
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={props.onClose} variant="outlined" sx={{ margin: 0.5 }}>
          ביטול
        </Button>
        <Button type="submit" variant="contained" sx={{ margin: 0.5 }} onClick={props.handleSave}>
          שמירה
        </Button>
      </Box>
    </GeneralPopup>
  );
}
