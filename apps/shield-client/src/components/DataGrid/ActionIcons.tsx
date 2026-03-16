import { ContentCopy, DeleteOutlined } from "@mui/icons-material";
import { PencilSimple } from "@phosphor-icons/react";
import { CardUserHeaderActionIcon } from "..";

type ActionIconsProps<T> = {
  id: T;
  edit?: (id: T) => void;
  copy?: (id: T) => void;
  deleteAction?: (id: T) => void;
  disableDelete?: boolean;
};

export function ActionIcons<T>({ id, edit, copy, deleteAction, disableDelete = false }: ActionIconsProps<T>) {
  return (
    <>
      {edit && (
        <CardUserHeaderActionIcon
          onClick={(e) => {
            e.stopPropagation();
            edit(id);
          }}
          aria-label="edit"
        >
          <PencilSimple weight="bold" color="#475467" style={{ width: 20, height: 20 }} />
        </CardUserHeaderActionIcon>
      )}
      {copy && (
        <CardUserHeaderActionIcon
          onClick={(e) => {
            e.stopPropagation();
            copy(id);
          }}
          aria-label="copy"
        >
          <ContentCopy style={{ width: 20, height: 20 }} />
        </CardUserHeaderActionIcon>
      )}
      {deleteAction && (
        <CardUserHeaderActionIcon
          onClick={(e) => {
            e.stopPropagation();
            deleteAction(id);
          }}
          aria-label="delete"
          disabled={disableDelete}
        >
          <DeleteOutlined sx={{ color: disableDelete ? "rgba(0, 0, 0, 0.38)" : "#E14A5C", height: "20px", width: "20px" }} />
        </CardUserHeaderActionIcon>
      )}
    </>
  );
}
