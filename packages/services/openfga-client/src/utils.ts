import { FGAObjectType, formatFGAObjectId, parseFGAObjectId } from "./generated/fga-types.ts";

export const PLATFORM_FGA = { type: "platform", id: "global" } satisfies { type: FGAObjectType; id: string };
export const PLATFORM_FGA_INSTANCE = formatFGAObjectId(PLATFORM_FGA);

export const parseFgaObjectIdsToIntIds = (objectIds: string[]): number[] => {
  return objectIds.reduce<number[]>((acc, objectId) => {
    const id = parseInt(parseFGAObjectId(objectId)?.id || "");
    if (id !== undefined && id !== null && !isNaN(id)) acc.push(id);
    return acc;
  }, []);
};
