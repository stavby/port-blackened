import { Skeleton } from "@mui/material";
import { IconProps, IdentificationBadge, Table } from "@phosphor-icons/react";
import { TASK_PERMISSION_REQ_TYPE, TASK_TABLE_TYPE, TaskType } from "@types";

const iconProps: IconProps = {
  size: 32,
  weight: "light",
  style: {
    color: "white",
    borderRadius: "4px",
    padding: "2px",
  },
};

type TaskHeaderIconProps = {
  taskType: TaskType | "loading";
};

export const TaskHeaderIcon = ({ taskType }: TaskHeaderIconProps) => {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {taskType === TASK_PERMISSION_REQ_TYPE && (
        <IdentificationBadge {...iconProps} style={{ ...iconProps.style, backgroundColor: "#24A8F6" }} />
      )}
      {taskType === TASK_TABLE_TYPE && (
        <Table
          {...iconProps}
          style={{
            ...iconProps.style,
            backgroundColor: "#3256DF",
          }}
        />
      )}
      {taskType === "loading" && <Skeleton variant="rounded" width={iconProps.size} height={iconProps.size} />}
    </div>
  );
};
