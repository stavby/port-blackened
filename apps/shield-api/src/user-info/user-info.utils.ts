type Nullable<T extends Record<PropertyKey, unknown>> = {
  [K in keyof T]?: T[K] | null | undefined;
};

export const toFullName = ({ first_name, last_name }: Nullable<{ first_name: string; last_name: string }>, defaultValue = ""): string =>
  first_name && last_name ? `${first_name} ${last_name}` : defaultValue;
