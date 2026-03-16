export * from "./generated/fga-types.ts";

import { UserID } from "@port/common-schemas";
import {
  formatFGAObjectId as formatFGAObjectIdPrev,
  FGAObjectType,
  FGAObjectUser,
  createTupleKey as createTupleKeyPrev,
  relationsByObjectType,
} from "./generated/fga-types.ts";
import { RelationshipCondition } from "@openfga/sdk";

type IdByFgaObject<T extends FGAObjectType> = T extends typeof FGAObjectUser ? UserID : string;

type TupleByFgaObject<T extends FGAObjectType> = `${T}:${IdByFgaObject<T>}`;

export const formatFGAObjectId = formatFGAObjectIdPrev as <T extends FGAObjectType>(object: {
  type: T;
  id: IdByFgaObject<T>;
}) => TupleByFgaObject<T>;

export const createTupleKey = createTupleKeyPrev as unknown as <T extends FGAObjectType>(
  objectType: T,
  objectId: IdByFgaObject<T>,
  relation: (typeof relationsByObjectType)[T][number],
  user: UserID,
  condition?: RelationshipCondition,
) => {
  object: TupleByFgaObject<T>;
  relation: (typeof relationsByObjectType)[T][number];
  user: UserID;
  condition?: RelationshipCondition;
};
