const getObjectKeys = <T extends object>(obj: T) => {
  return Object.keys(obj) as (keyof T)[];
};

const getObjectValues = <T extends object>(obj: T) => {
  return Object.values(obj) as T[keyof T][];
};

const getObjectEntries = <T extends object>(obj: T) => {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
};

const countMap = <T extends string | number>(list: T[]): Map<T, number> => {
  const map = new Map<T, number>();

  for (const value of list) {
    map.set(value, map.get(value) ?? 0 + 1);
  }

  return map;
};

const arrayEqual = <T extends string | number>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  const itemFrequency = countMap(a);

  for (const bValue of b) {
    const aCount = itemFrequency.get(bValue);

    if (aCount === undefined) return false;

    const nextCount = aCount - 1;

    if (nextCount === 0) {
      itemFrequency.delete(bValue);
    } else {
      itemFrequency.set(bValue, nextCount);
    }
  }

  return itemFrequency.size === 0;
};

const dateLocaleStringSettings: [Intl.LocalesArgument, Intl.DateTimeFormatOptions] = [
  "he-IL",
  {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  },
] as const;

const calculateRunTime = (run_seconds: number) => {
  if (run_seconds) {
    if (run_seconds < 60) {
      return `${Math.floor(run_seconds)} שניות`;
    } else if (run_seconds / 60 < 60) {
      const minutes = Math.floor(run_seconds / 60);
      let remaining_seconds = Math.floor(run_seconds % 60);
      remaining_seconds = remaining_seconds * 0.01;

      return `${(minutes + remaining_seconds).toFixed(2).replace(".", ":")} דקות`;
    } else {
      const hours = Math.floor(run_seconds / 60 ** 2);
      let remaining_minutes = Math.floor((run_seconds % 60 ** 2) / 60);
      remaining_minutes = remaining_minutes * 0.01;

      return `${(hours + remaining_minutes).toFixed(2).replace(".", ":")} שעות`;
    }
  } else {
    return "-";
  }
};

export { getObjectKeys, getObjectValues, getObjectEntries, arrayEqual, dateLocaleStringSettings, calculateRunTime };
