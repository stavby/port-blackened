import { Refinement } from "zod";

export type RefinementArg<T> = T extends Refinement<infer U> ? U : never;
export type OmitPath<T, Path extends readonly PropertyKey[]> = Path extends []
  ? T
  : T extends readonly (infer U)[]
    ? Path extends [number, ...infer Rest]
      ? OmitPath<U, Extract<Rest, PropertyKey[]>>[]
      : T
    : T extends object
      ? Path extends [infer K, ...infer Rest]
        ? K extends keyof T
          ? Rest extends []
            ? Omit<T, K>
            : { [P in keyof T]: P extends K ? OmitPath<T[P], Extract<Rest, PropertyKey[]>> : T[P] }
          : T
        : T
      : T;

export type OmitPaths<T, Paths extends readonly PropertyKey[][]> = Paths extends [
  infer P extends PropertyKey[],
  ...infer Rest extends PropertyKey[][],
]
  ? OmitPaths<OmitPath<T, P>, Rest>
  : T;

export type OptionalPath<T, Path extends readonly PropertyKey[]> = Path extends []
  ? T
  : T extends readonly (infer U)[]
    ? Path extends [number, ...infer Rest]
      ? OptionalPath<U, Extract<Rest, PropertyKey[]>>[]
      : T
    : T extends object
      ? Path extends [infer K, ...infer Rest]
        ? K extends keyof T
          ? Rest extends []
            ? Omit<T, K> & Partial<Pick<T, K>>
            : { [P in keyof T]: P extends K ? OptionalPath<T[P], Extract<Rest, PropertyKey[]>> : T[P] }
          : T
        : T
      : T;

export type OptionalPaths<T, Paths extends readonly PropertyKey[][]> = Paths extends [
  infer P extends PropertyKey[],
  ...infer Rest extends PropertyKey[][],
]
  ? OptionalPaths<OptionalPath<T, P>, Rest>
  : T;

export type AddPath<T, Path extends readonly PropertyKey[], V> = Path extends []
  ? T
  : T extends readonly (infer U)[]
    ? Path extends [number, ...infer Rest]
      ? AddPath<U, Extract<Rest, PropertyKey[]>, V>[]
      : T
    : T extends object
      ? Path extends [infer K, ...infer Rest]
        ? K extends keyof T | PropertyKey
          ? Rest extends []
            ? Omit<T, K> & { [P in K]: V }
            : { [P in keyof T]: P extends K ? AddPath<T[P], Extract<Rest, PropertyKey[]>, V> : T[P] }
          : T
        : T
      : T;
