import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { Plus } from "@phosphor-icons/react";
import { Domain, UserDomain, UserDomainDto } from "@types";
import { MouseEvent, useReducer, useState } from "react";
import { AddUserDomainPopover } from "./AddUserDomainPopover";
import { NoDomains } from "./NoDomains";
import { CountChipStyled } from "./UserDomains.style";
import { UserDomainsList } from "./UserDomainsList";
import { WarningDeletePopup } from "@components/Popup";
import AddClassificationsPopup from "./AddClassificationsPopup";
import { ObjectIdBrand } from "@port/shield-schemas";
import { hasDirectSource } from "@helpers/permissionSources";

type PopoverState = {
  addDomain: boolean;
  editDomain: boolean;
  deleteDomain: boolean;
};

type PopoverAction = {
  type: "SET_ADD_DOMAIN" | "SET_EDIT_DOMAIN" | "SET_DELETE_DOMAIN";
  payload: boolean;
};

const popoverReducer = (state: PopoverState, action: PopoverAction): PopoverState => {
  switch (action.type) {
    case "SET_ADD_DOMAIN":
      return { ...state, addDomain: action.payload };
    case "SET_EDIT_DOMAIN":
      return { ...state, editDomain: action.payload };
    case "SET_DELETE_DOMAIN":
      return { ...state, deleteDomain: action.payload };
    default:
      return state;
  }
};

export type TUserDomainListItem = Pick<UserDomain, "id" | "name" | "display_name" | "classifications" | "sources">;
export type TUserDomainListItemDto = Pick<UserDomainDto, "id" | "name" | "display_name" | "classifications">;

export type UserDomainsProps = {
  userDomains: TUserDomainListItem[];
  domainsOptions: Domain[];
  domainsOptionsMap: Map<string, Domain>;
  isAddDomainsButtonDisabled?: boolean;
  handleDeleteDomain: (domainId: string) => void;
  handleDeleteClassifications: (classificationIds: ObjectIdBrand[], domainId: ObjectIdBrand) => void;
  handleSaveClassifications: (classifications: UserDomainDto["classifications"], domainId: ObjectIdBrand) => void;
  handleAddDomains: (domainsToAdd: TUserDomainListItemDto[]) => void;
  disableEdit?: boolean;
};

export const UserDomains = ({
  userDomains,
  domainsOptions,
  domainsOptionsMap,
  isAddDomainsButtonDisabled,
  handleDeleteDomain,
  handleAddDomains,
  handleDeleteClassifications,
  handleSaveClassifications,
  disableEdit,
}: UserDomainsProps) => {
  const [popoversState, dispatchPopoversState] = useReducer(popoverReducer, { addDomain: false, editDomain: false, deleteDomain: false });
  const [anchorEl, setAnchorEL] = useState<HTMLButtonElement | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<TUserDomainListItem | null>(null);

  const handleOpenAddPopup = (event: MouseEvent<HTMLButtonElement>) => {
    dispatchPopoversState({ type: "SET_ADD_DOMAIN", payload: true });
    setAnchorEL(event.currentTarget);
  };

  const handleOpenEditPopup = (selectedDomain: TUserDomainListItem) => {
    setSelectedDomain(selectedDomain);
    dispatchPopoversState({ type: "SET_EDIT_DOMAIN", payload: true });
  };

  const handleOpenDeletedPopup = (selectedDomain: TUserDomainListItem) => {
    setSelectedDomain(selectedDomain);
    dispatchPopoversState({ type: "SET_DELETE_DOMAIN", payload: true });
  };

  const handleAddDomainsWrapper = (domainIds: ObjectIdBrand[]) => {
    const newUserDomains = domainIds.reduce<TUserDomainListItemDto[]>((acc, domainId) => {
      const currentUserDomain = userDomains.find(({ id }) => id === domainId);
      if (!currentUserDomain || hasDirectSource(currentUserDomain.sources)) {
        acc.push({
          id: domainId,
          name: domainsOptionsMap.get(domainId)?.name ?? "",
          display_name: domainsOptionsMap.get(domainId)?.display_name ?? "",
          classifications: [],
        });
      }

      return acc;
    }, []);

    handleAddDomains(newUserDomains);
  };

  const handleDeleteDomainWrapper = () => {
    if (selectedDomain) {
      handleDeleteDomain(selectedDomain.id);
      dispatchPopoversState({ type: "SET_DELETE_DOMAIN", payload: false });
    }
  };

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Box height="100%" display="flex" flexDirection="column">
        <Stack direction={"row"} spacing={1} sx={{ alignItems: "center", paddingBottom: 1.5 }}>
          <CountChipStyled label={userDomains.length} />
          <Typography sx={{ fontWeight: "bold" }}>עולמות תוכן קיימים</Typography>
        </Stack>
        <Divider />
        {userDomains.length > 0 ? (
          <>
            <UserDomainsList
              userDomains={userDomains}
              domainsOptionsMap={domainsOptionsMap}
              handleDeleteClassifications={handleDeleteClassifications}
              handleOpenEditPopup={handleOpenEditPopup}
              handleOpenDeletedPopup={handleOpenDeletedPopup}
              disableEdit={disableEdit}
            />
            <Box>
              <Button
                sx={{ outline: 0, MozOutlineRadius: "15px" }}
                onClick={handleOpenAddPopup}
                variant="contained"
                disabled={disableEdit || isAddDomainsButtonDisabled}
              >
                <Plus size={16} />
              </Button>
            </Box>
          </>
        ) : (
          <Stack sx={{ textAlign: "center" }} direction="column" alignItems="center" spacing={2} flexGrow={1} justifyContent="center">
            <NoDomains />
            <Button
              sx={{ MozOutlineRadius: "15px" }}
              onClick={handleOpenAddPopup}
              color="secondary"
              variant="contained"
              disabled={disableEdit || isAddDomainsButtonDisabled}
            >
              <Plus size={16} />
            </Button>
          </Stack>
        )}
        {popoversState.addDomain && (
          <AddUserDomainPopover
            open={popoversState.addDomain}
            onClose={() => dispatchPopoversState({ type: "SET_ADD_DOMAIN", payload: false })}
            domainsOptions={domainsOptions}
            disabledDomainsIds={userDomains.map((d) => d.id)}
            handleSave={handleAddDomainsWrapper}
            anchorEL={anchorEl}
          />
        )}

        <WarningDeletePopup
          openDelete={popoversState.deleteDomain}
          setOpenDelete={() => dispatchPopoversState({ type: "SET_DELETE_DOMAIN", payload: false })}
          handleConfirmDelete={handleDeleteDomainWrapper}
          title={`מחיקת עולם תוכן ${selectedDomain?.display_name}`}
        >
          <Typography>שים לב, לאחר שמירה עולם התוכן יימחק.</Typography>
        </WarningDeletePopup>

        {popoversState.editDomain && selectedDomain && (
          <AddClassificationsPopup
            domainId={selectedDomain.id}
            open={popoversState.editDomain}
            initialSelectedClassifications={selectedDomain.classifications}
            onClose={() => dispatchPopoversState({ type: "SET_EDIT_DOMAIN", payload: false })}
            domainsOptionsMap={domainsOptionsMap}
            handleSave={(classifications) => {
              handleSaveClassifications(classifications, selectedDomain.id);
            }}
          />
        )}
      </Box>
    </Box>
  );
};
