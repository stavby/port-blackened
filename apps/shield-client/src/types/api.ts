import { QueryKey, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { ClassificationDBModel } from "./db";

export type OverridableQueryOptions<TReturn> = Omit<UseQueryOptions<TReturn, unknown, TReturn, QueryKey>, "queryKey" | "queryFn">;

export type OverridableMutationOptions<TData, TVariables> = Omit<UseMutationOptions<TData, unknown, TVariables>, "mutationFn">;

export type GetDomainClassificationsApiResponse = ClassificationDBModel[];
