import { Divider, List } from "@mui/material";
import { Fragment } from "react";
import { UserDomainListItem } from "./UserDomainListItem";
import { TUserDomainListItem, UserDomainsProps } from "./UserDomains";

export interface UserDomainsListProps
  extends Pick<UserDomainsProps, "userDomains" | "domainsOptionsMap" | "handleDeleteClassifications" | "disableEdit"> {
  handleOpenEditPopup: (selectedUserDomain: TUserDomainListItem) => void;
  handleOpenDeletedPopup: (selectedUserDomain: TUserDomainListItem) => void;
}

export const UserDomainsList = ({
  userDomains,
  domainsOptionsMap,
  handleDeleteClassifications,
  handleOpenEditPopup,
  handleOpenDeletedPopup,
  disableEdit,
}: UserDomainsListProps) => {
  return (
    <List sx={{ maxHeight: "90%", overflowY: "auto", p: 0, pb: 1 }}>
      {userDomains.map((domain) => (
        <Fragment key={domain.id}>
          <UserDomainListItem
            domain={domain}
            domainsOptionsMap={domainsOptionsMap}
            handleDeleteClassifications={handleDeleteClassifications}
            handleOpenEditPopup={handleOpenEditPopup}
            handleOpenDeletedPopup={handleOpenDeletedPopup}
            disableEdit={disableEdit}
          />
          <Divider />
        </Fragment>
      ))}
    </List>
  );
};
