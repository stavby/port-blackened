import UserFullNameTooltip from "@components/UserFullNameTooltip";
import { Box, Card, CardActionArea, Chip, Stack, Typography, cardClasses } from "@mui/material";
import { Lightning, UserCircle } from "@phosphor-icons/react";
import { formatDate } from "@port/utils";
import { Task } from "@screens/MyTasks";
import { TASK_PERMISSION_REQ_TYPE, TASK_TABLE_TYPE } from "@types";
import React from "react";
import { StyledChip } from "./TaskCard.styles";
import { TaskHeaderIcon } from "./TaskHeaderIcon";

type TaskCardProps = React.ComponentProps<typeof Card> & React.PropsWithChildren<{ task: Task }>;

const isTaskUrgent = (taskModifyDate: Date | string): boolean => {
  const URGENT_NUMBER_OF_DAYS = 5;
  const currentDate = new Date();
  const formattedTaskCreateDate = new Date(taskModifyDate);
  const timeDiff = currentDate.getTime() - formattedTaskCreateDate.getTime();
  const daysDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000));

  return daysDiff > URGENT_NUMBER_OF_DAYS;
};

/**
 * @Skeleton ./TaskCardSkeleton.tsx
 */
export const TaskCard = ({ task, children, ...cardProps }: TaskCardProps) => {
  const { _id, type, title } = task;
  const modify_date = formatDate(task.modify_date);
  const isPermissionRequest = type === TASK_PERMISSION_REQ_TYPE;
  const tableName = task.type === "TableClassification" ? task.tableData.table_name : null;
  const owner = task.type === "TableClassification" ? task.tableData.owner : undefined;

  const chips = isPermissionRequest
    ? [
        <Chip
          key={_id}
          label={
            <UserFullNameTooltip user_id={owner}>
              <Box sx={{ display: "flex", alignContent: "center" }}>
                <UserCircle size={22} color="#24A8F6" />
                {owner}
              </Box>
            </UserFullNameTooltip>
          }
        />,
        <Chip label={owner} />,
      ]
    : [
        <Chip
          key={_id}
          label={
            <UserFullNameTooltip user_id={owner}>
              <Box sx={{ display: "flex", alignContent: "center", alignItems: "center", gap: "6px" }}>
                <UserCircle size={22} color="#3256DF" weight="duotone" />
                {owner}
              </Box>
            </UserFullNameTooltip>
          }
          sx={{ padding: "3px 4px 3px 4px", backgroundColor: "#E5E7F9" }}
        />,
      ];

  return (
    <Card variant="outlined" {...cardProps}>
      <CardActionArea
        sx={{
          p: 2,
          [`${cardClasses.root}:last-child`]: {
            paddingBottom: 2,
          },
        }}
      >
        <Stack
          width={"100%"}
          direction={"column"}
          justifyContent={"space-between"}
          sx={{
            minHeight: "230px",
          }}
        >
          <Box>
            <Stack pb={0.5} direction={"row"} justifyContent="space-between">
              <TaskHeaderIcon taskType={type} />
              <Box alignItems="end" display="flex" flexDirection="column" gap={0.5}>
                {isTaskUrgent(task.modify_date) && (
                  <StyledChip
                    sx={{ color: "#FC5367", borderColor: "#FDAEB4", width: "fit-content" }}
                    variant="outlined"
                    label={
                      <Stack direction={"row"} alignItems="center" spacing={0.6}>
                        <Lightning weight="duotone" />
                        <Typography fontSize={16} fontWeight={500}>
                          לטיפול מיידי
                        </Typography>
                      </Stack>
                    }
                  />
                )}
              </Box>
            </Stack>
            <Typography textAlign="start" fontSize={14} sx={{ color: "text.secondary" }}>
              {modify_date}
            </Typography>
          </Box>
          <Box>
            <Typography fontSize={20} sx={{ fontWeight: "bold", textAlign: "initial", mb: 0.5 }}>
              {title}
            </Typography>
            {!!tableName && (
              <Typography fontSize={16} sx={{ textAlign: "initial", mb: 0.5 }}>
                {tableName}
              </Typography>
            )}
            <Box fontSize={16} display="flex" alignItems="center" mb={1} sx={{ color: "text.secondary" }}>
              {children}
            </Box>
          </Box>
          <Box display="flex" alignItems="center">
            {chips}
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
};
