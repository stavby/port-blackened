import { Box, Card, CardProps, Skeleton, Stack, cardClasses } from "@mui/material";
import { TaskHeaderIcon } from "./TaskHeaderIcon";

/**
 * @Skeleton for Task Card
 */
export const TaskCardSkeleton = ({ ...cardProps }: CardProps) => {
  return (
    <Card variant="outlined" {...cardProps}>
      <Box
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
            minHeight: "20vh",
          }}
        >
          <Stack direction={"row"} justifyContent="space-between" paddingBottom={1}>
            <TaskHeaderIcon taskType="loading" />
          </Stack>
          <Box>
            <Skeleton variant="rounded" width="76px" height="20px" sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="160px" height="25px" sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="100px" height="20px" sx={{ mb: 2 }} />
          </Box>
          <Box display="flex" alignItems="center">
            <Skeleton variant="rounded" width={120} height={32} sx={{ borderRadius: 15 }} />
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};
