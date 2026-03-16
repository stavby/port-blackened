import {
  ClientCheckRequest,
  ClientListObjectsRequest,
  ClientListRelationsRequest,
  ClientListUsersRequest,
  ClientWriteRequest,
  ReadResponse,
  Tuple,
} from "@openfga/sdk";
import { FGAObjectType, FGARelation, FGATupleKey } from "./generated/fga-types.ts";

export type DomainRole = "rav_amlach" | "amlach" | "kapat" | "implementor" | "analyst" | "documentator" | "support_center" | "api_user";
export type ConnectionRole = "viewer" | "user" | "developer" | "maintainer" | "documentator";

type TypedOmit<T, K extends keyof T> = Omit<T, K>;
type Prettify<T> = { [K in keyof T]: T[K] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TailParameters<F extends (...args: any[]) => any> = F extends (_: any, ...args: infer R) => any ? R : never;

export type FGAClientListObjectsRequest = Prettify<
  TypedOmit<ClientListObjectsRequest, "type" | "contextualTuples" | "relation"> & {
    type: FGAObjectType;
    contextualTuples?: FGATupleKey[];
    relation: FGARelation;
  }
>;

export type FGATupleKeyWithoutCondition = TypedOmit<FGATupleKey, "condition">;

export type FGAClientCheckRequest = Prettify<
  TypedOmit<ClientCheckRequest, "contextualTuples" | keyof FGATupleKeyWithoutCondition> &
    FGATupleKeyWithoutCondition & {
      contextualTuples?: FGATupleKey[];
    }
>;

export type FGAClientListRelationsRequest = Prettify<
  TypedOmit<ClientListRelationsRequest, "relations" | keyof TypedOmit<FGAClientCheckRequest, "relation" | "context">> &
    TypedOmit<FGAClientCheckRequest, "relation" | "context"> & {
      relations?: FGARelation[];
    }
>;

export type FGAClientListUsersRequest = Prettify<
  TypedOmit<ClientListUsersRequest, "contextualTuples" | "object" | "relation" | "user_filters"> & {
    contextualTuples?: FGATupleKey[];
    object: { type: FGAObjectType; id: string };
    relation: FGARelation;
    user_filters: { type: FGAObjectType; relation?: FGARelation }[];
  }
>;

export type FgaClientWriteRequest = Prettify<
  TypedOmit<ClientWriteRequest, "writes" | "deletes"> & {
    writes?: FGATupleKey[];
    deletes?: FGATupleKeyWithoutCondition[];
  }
>;

export type FGATuple = Prettify<Pick<Tuple, "timestamp"> & { key: FGATupleKey }>;

export type FGAReadRequestTupleKey = Partial<FGATupleKeyWithoutCondition>;
export type FGAReadResponse = Prettify<
  Pick<ReadResponse, "continuation_token"> & {
    tuples: FGATuple[];
  }
>;
