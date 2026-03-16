export const difference = <T>(current: Set<T>, other: Set<T>): Set<T> => {
  const result = new Set<T>(current);

  if (current.size <= other.size) {
    for (const item of other) {
      if (current.has(item)) result.delete(item);
    }
  } else {
    for (const item of current) {
      if (other.has(item)) result.delete(item);
    }
  }

  return result;
};
