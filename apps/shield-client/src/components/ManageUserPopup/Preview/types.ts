import { UserID } from "@port/common-schemas";
import { GetUserPreviewSchema } from "@port/shield-schemas";

export type BrowserApplication = "source_table" | "remix";
export type GetUserPreviewWithId = GetUserPreviewSchema & { userId: UserID };
