import { PermissionSource } from "@port/shield-utils";

type NonDirectPermissionSource = Omit<PermissionSource, "id"> & { id: Exclude<PermissionSource["id"], "direct"> };

export const hasDirectSource = (sources: PermissionSource[]) => {
  return sources.some((source) => source.id === "direct");
};

export const hasNonDirectSources = (sources: PermissionSource[]) => {
  return sources.some((source) => source.id !== "direct");
};

export const getNonDirectSources = (sources: PermissionSource[]) => {
  return sources.filter((source): source is NonDirectPermissionSource => source.id !== "direct");
};

export const formatNonDirectSources = (sources: NonDirectPermissionSource[]) => {
  if (sources.length === 0) {
    return;
  }

  if (sources.length === 1) {
    return `
    ההרשאה התקבלה על ידי קבוצת ההרשאה ${sources[0]!.display_name}
  `;
  }

  return `
    ההרשאה התקבלה על ידי קבוצות ההרשאה: ${sources.map(({ display_name }) => display_name).join(", ")}
  `;
};
