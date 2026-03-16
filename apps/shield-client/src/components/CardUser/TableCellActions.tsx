import { deleteUserDomainByDomainId } from "@api/users";
import { hasNonDirectSources } from "@helpers/permissionSources";
import { updateUserInCache } from "@helpers/users";
import { DeleteOutlined, MoreVert } from "@mui/icons-material";
import { Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, SxProps } from "@mui/material";
import { PencilSimple } from "@phosphor-icons/react";
import { useSnackBarStore } from "@store/snackbarStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Domain, UserDomain, UserDto } from "@types";
import { useState } from "react";
import { ManageUserPopUp, WarningDeletePopup } from "..";

type ActionsProps = {
  key: number;
  text: string;
  icon: JSX.Element;
  handleClick: () => void;
  style?: SxProps;
  disabled?: boolean;
};

type TableCellActionsProps = {
  mergedDomain: UserDomain;
  userDto: UserDto;
  domainsOptions: Domain[];
  domainsOptionsMap: Map<string, Domain>;
};

export const TableCellActions = ({ mergedDomain, userDto, domainsOptions, domainsOptionsMap }: TableCellActionsProps) => {
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const queryClient = useQueryClient();

  const { setSnackbarSuccess, setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));

  const actions: ActionsProps[] = [
    {
      key: 1,
      text: "עריכה",
      icon: <PencilSimple size={20} />,
      handleClick: () => {
        setOpenEdit(true);
      },
    },
    {
      key: 2,
      text: "מחיקה",
      icon: <DeleteOutlined />,
      handleClick: () => {
        setOpenDelete(true);
      },
      style: { color: "#E14A5C" },
      disabled: hasNonDirectSources(mergedDomain.sources),
    },
  ];

  const handleActionClick = (event?: EventTarget & HTMLButtonElement) => {
    setAnchorEl(event && !openPopover ? event : null);
    setOpenPopover((prevState) => !prevState);
  };

  const useDeleteUserDomainByIdMutation = useMutation({
    mutationFn: deleteUserDomainByDomainId,
    onSuccess: (updatedUser) => {
      updateUserInCache(queryClient, updatedUser);
      queryClient.invalidateQueries({ queryKey: ["paginatedUsers"] });
      setSnackbarSuccess("עולם התוכן נמחק בהצלחה");
    },
    onError: () => {
      setSnackbarError("שגיאה בעת מחיקת עולם התוכן");
    },
  });

  const handleConfirmDeleteDomain = () => {
    setOpenDelete(false);
    useDeleteUserDomainByIdMutation.mutate({ id: userDto._id, domainId: mergedDomain.id });
  };

  return (
    <>
      {openEdit && (
        <ManageUserPopUp
          openModal={openEdit}
          setOpenModal={setOpenEdit}
          editedUser={userDto}
          handleChangeEditedUser={(user) => {
            updateUserInCache(queryClient, user);
            queryClient.invalidateQueries({ queryKey: ["paginatedUsers"] });
          }}
          domainsOptions={domainsOptions}
          domainsOptionsMap={domainsOptionsMap}
        />
      )}
      <WarningDeletePopup
        openDelete={openDelete}
        setOpenDelete={setOpenDelete}
        handleConfirmDelete={handleConfirmDeleteDomain}
        title={`מחיקת עולם תוכן ${mergedDomain.display_name}`}
      />
      {/* Actions Menu */}
      <IconButton
        disabled={!domainsOptionsMap.get(mergedDomain.id)}
        onClick={(event) => {
          handleActionClick(event.currentTarget);
        }}
      >
        <MoreVert sx={{ width: "20px", height: "20px" }} />
      </IconButton>
      <Menu
        open={openPopover}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClose={() => {
          handleActionClick();
        }}
        disableRestoreFocus
        MenuListProps={{ "aria-labelledby": "long-button" }}
      >
        {actions.map((action) => (
          <div key={action.key}>
            <MenuItem
              onClick={() => {
                action.handleClick();
                handleActionClick();
              }}
              sx={action.style}
              disabled={action.disabled}
            >
              <ListItemText>{action.text}</ListItemText>
              <ListItemIcon sx={action.style}>{action.icon}</ListItemIcon>
            </MenuItem>
            {action.key !== actions.length && <Divider />}
          </div>
        ))}
      </Menu>
    </>
  );
};
