import { USE_TASKS_QUERY_KEY, markTaskAsDone, useTasksQuery } from "@api/tasks";
import { ClassificationPopup, NoData, SearchField, SelectableSegment, TaskCard, TaskCardSkeleton } from "@components";
import { StickyPageHeader } from "@components/StickyPageHeader";
import StyledTooltipShield from "@components/Tooltip";
import { Box, Grid, Typography } from "@mui/material";
import { IdentificationBadge, ListChecks, SortAscending, SortDescending, Table } from "@phosphor-icons/react";
import { useSnackBarStore } from "@store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GeneralTask, TASK_PERMISSION_REQ_TYPE, TASK_TABLE_TYPE } from "@types";
import React, { useMemo, useState } from "react";

type TabType = "All" | "Classifications" | "PermissionRequests";

type Tab = {
  type: TabType;
  title: string;
  icon?: React.ReactNode;
};

type Sorting = {
  type: "asc" | "desc";
  icon: React.ReactNode;
  tooltipTitle: string;
};

export type Task = {
  title: string;
  content: string;
} & GeneralTask;

const tabTasksFilters: Record<TabType, (task: Task) => boolean> = {
  All: () => true,
  Classifications: (task) => task.type === TASK_TABLE_TYPE,
  PermissionRequests: (task) => task.type === TASK_PERMISSION_REQ_TYPE,
};

const tabs: Array<Tab> = [
  {
    type: "All",
    title: "כל המשימות",
  },
  {
    type: "Classifications",
    title: "סיווג טבלאות",
    icon: <Table fontSize={20} />,
  },
  {
    type: "PermissionRequests",
    title: "בקשות הרשאה",
    icon: <IdentificationBadge fontSize={20} />,
  },
];

const sortingByDate: Sorting[] = [
  {
    type: "asc",
    icon: <SortAscending />,
    tooltipTitle: "מישן לחדש",
  },
  {
    type: "desc",
    icon: <SortDescending />,
    tooltipTitle: "מחדש לישן",
  },
];

const sortByDate = (currDate: Date | string, nextDate: Date | string, isAsc: boolean) => {
  const [currDateTime, nextDateTime] = [new Date(currDate).getTime(), new Date(nextDate).getTime()];
  return isAsc ? currDateTime - nextDateTime : nextDateTime - currDateTime;
};

function MyTasks() {
  const [selectedTab, setSelectedTab] = useState<TabType>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSortByDateType, setSelectedSortByDateType] = useState<Sorting["type"]>("asc");
  const { data: tasks, isLoading } = useTasksQuery();
  const queryClient = useQueryClient();

  const isClassificationPopupOpen = selectedTask?.type === TASK_TABLE_TYPE;
  const { setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));

  const formattedTasks = useMemo(() => {
    return (
      tasks?.map((task) => {
        let title = "חסרה כותרת";
        let content = "חסר תוכן";

        switch (task.type) {
          case TASK_TABLE_TYPE:
            title = task.tableData?.table_display_name ?? task.tableData?.table_name;
            content = task.tableData.attributes?.display_name ?? task.tableData.attributes?.domain;
            break;
          case TASK_PERMISSION_REQ_TYPE:
            // TO DO: add title and content to permission request tasks
            break;
        }

        return { ...task, title, content };
      }) ?? []
    );
  }, [tasks]);

  const selectedTabTask = useMemo(() => {
    return formattedTasks?.filter((task) => tabTasksFilters[selectedTab](task)) ?? [];
  }, [formattedTasks, selectedTab]);

  const filteredTasks = useMemo(() => {
    const loweredSearchTerm = searchTerm.toLowerCase();
    return searchTerm
      ? selectedTabTask.filter(
          (task) =>
            task.title?.toLowerCase().includes(loweredSearchTerm) ||
            task.content?.toLowerCase().includes(loweredSearchTerm) ||
            (task.type === "TableClassification" && task.tableData.table_name.toLowerCase().includes(loweredSearchTerm)),
        )
      : selectedTabTask;
  }, [selectedTabTask, searchTerm]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((currTask, nextTask) =>
      sortByDate(currTask.modify_date, nextTask.modify_date, selectedSortByDateType === "asc"),
    );
  }, [filteredTasks, selectedSortByDateType]);

  const markTaskAsDoneMutation = useMutation({
    mutationFn: async (taskId: Task["_id"]) => {
      await markTaskAsDone(taskId);
    },
    onSuccess: (_data, taskId) => {
      queryClient.setQueryData(USE_TASKS_QUERY_KEY, (oldTasks: Task[] | undefined) => oldTasks?.filter((task) => task._id !== taskId));
    },
    onError: (error) => {
      setSnackbarError("שגיאה בעת סימון המשימה כבוצעה", error);
    },
    meta: {
      loading: false,
    },
  });

  function handleTaskCompleted() {
    if (selectedTask) {
      markTaskAsDoneMutation.mutate(selectedTask._id);
    }
  }

  const getTasksCards = () => {
    // no open tasks
    if (!isLoading && selectedTabTask.length === 0)
      return (
        <Box mx="auto">
          <NoData mainText="זה הזמן לנוח" secondaryText="משימות בדרך אליך, נעיר אותך בקרוב!" />
        </Box>
      );

    // no tasks after search
    if (!isLoading && sortedTasks.length === 0)
      return (
        <Box mx="auto">
          <NoData mainText="לא נמצאו משימות" secondaryText="אולי כדאי לחפש משהו אחר :)" />
        </Box>
      );

    // all tasks cards
    return (
      <Grid container spacing={2}>
        {isLoading
          ? Array(6)
              .fill(0)
              .map((_, idx) => (
                <Grid item xs={3} key={idx}>
                  <TaskCardSkeleton />
                </Grid>
              ))
          : sortedTasks.map((task, idx) => (
              <Grid item xs={3} key={idx}>
                <TaskCard
                  task={task}
                  onClick={() => {
                    setSelectedTask(task);
                  }}
                >
                  {task.content}
                </TaskCard>
              </Grid>
            ))}
      </Grid>
    );
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <StickyPageHeader>
          {/* Page Title */}
          <Box sx={{ display: "flex" }} alignItems="center" margin={1}>
            <ListChecks color="#5f5858" fontSize={25} weight="thin" style={{ marginLeft: 5 }} />
            <Typography marginRight={5} variant="h5" fontWeight="bold">
              המשימות שלי
            </Typography>
            <Box padding="3px 0px 3px 4px">
              <Box borderRadius={2} display="flex">
                <Box
                  sx={{
                    borderRadius: 2,
                    padding: "12px",
                    display: "inline-flex",
                    bgcolor: "#E5E7F9",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 2,
                      backgroundColor: "primary.main",
                      color: "white",
                      fontWeight: "bold",
                      padding: "4px",
                      marginRight: "4px",
                      fontSize: "14px",
                      height: "28px",
                      width: "28px",
                    }}
                  >
                    {selectedTabTask.length}
                  </Box>
                  <Typography sx={{ fontWeight: "500", marginTop: "2px" }}>משימות פתוחות</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          {/* Title Wrap (Tabs Segment) */}
          <Box padding="3px 0px 3px 4px">
            {/* Segmented Group */}
            <Box borderRadius={2} display="flex" width="fit-content" columnGap={3}>
              {/* Box */}
              <Box borderRadius={2} padding="4px" display="inline-flex" bgcolor="#E5E7F9">
                {/* Tabs Segment */}
                {tabs.map((tab) => (
                  <SelectableSegment
                    key={tab.type}
                    title={tab.title}
                    icon={tab.icon}
                    onClick={() => setSelectedTab(tab.type)}
                    selected={tab.type === selectedTab}
                    selectedStyle={{ backgroundColor: "white" }}
                    borderRadius={1}
                    padding="3px 10px 3px 10px"
                    display="flex"
                    alignItems="center"
                    gap="6px"
                  />
                ))}
              </Box>
              {/* Sorting Segment */}
              <Box display="flex" bgcolor="#E5E7F9" borderRadius={2} padding="4px">
                {sortingByDate.map((sort) => (
                  <StyledTooltipShield key={sort.type} title={sort.tooltipTitle} enterDelay={300} enterNextDelay={300} placement="top">
                    <SelectableSegment
                      icon={sort.icon}
                      borderRadius={1}
                      onClick={() => setSelectedSortByDateType(sort.type)}
                      selected={sort.type === selectedSortByDateType}
                      selectedStyle={{ backgroundColor: "white" }}
                      padding="3px 10px 3px 10px"
                      display="flex"
                      alignItems="center"
                      gap="6px"
                    />
                  </StyledTooltipShield>
                ))}
              </Box>
            </Box>
          </Box>
          {/* Search */}
          <Box display="flex">
            <SearchField handleSearch={setSearchTerm} />
          </Box>
        </StickyPageHeader>
        {/* Cards */}
        {getTasksCards()}
      </Box>
      {isClassificationPopupOpen && selectedTask && (
        <ClassificationPopup
          open={isClassificationPopupOpen}
          onClose={() => {
            setSelectedTask(null);
          }}
          onSave={handleTaskCompleted}
          data={{
            table: {
              id: selectedTask.tableData._id,
              displayName: selectedTask.tableData.table_display_name,
              is_sap: selectedTask.tableData.is_sap,
              source_type: selectedTask.tableData.source_type,
              connection_display_name: selectedTask.tableData.connection_display_name,
            },
            domain: {
              id: selectedTask.tableData.attributes.domain_id,
              displayName: selectedTask.tableData.attributes.display_name,
            },
          }}
        />
      )}
    </>
  );
}

export default MyTasks;
