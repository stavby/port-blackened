import { MARK_TASK_AS_DONE_ENDPOINT, TASKS_ENDPOINT } from "@constants";
import { Task } from "@screens/MyTasks";
import { useQuery } from "@tanstack/react-query";

import { OverridableQueryOptions } from "@types";

import axios from "axios";

export const USE_TASKS_QUERY_KEY = ["tasks"] as const;

export const useTasksQuery = (queryOptions?: OverridableQueryOptions<Task[]>) => {
  return useQuery({
    queryKey: USE_TASKS_QUERY_KEY,
    queryFn: async () => {
      const response = await axios.get<Task[]>(TASKS_ENDPOINT);
      return response.data;
    },
    ...queryOptions,
  });
};

export const markTaskAsDone = async (id: string) => {
  const response = await axios.put(MARK_TASK_AS_DONE_ENDPOINT(id));

  return response;
};
