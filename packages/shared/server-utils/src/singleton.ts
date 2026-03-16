type Apps = "PLATFORM" | "REMIX";
type UppercaseSelfMap<T extends Record<string, string>> = {
  [K in keyof T]: K extends string ? (K extends Uppercase<K> ? (T[K] extends K ? K : never) : never) : never;
};

const createUpperSamePairedObject = <const T extends Record<string, string>>(
  obj: T,
  ..._lockedParams: T extends UppercaseSelfMap<T> ? [] : ["INVALID_PAIRED_OBJECT"]
): T => {
  return obj as T;
};

export const SINGLETON_KEYS = {
  PLATFORM: createUpperSamePairedObject({
    SHIELD_API: "SHIELD_API",
    KEYCLOAK_ADMIN: "KEYCLOAK_ADMIN",
    FORM_ANSWERS: "FORM_ANSWERS",
    TRINO_SERVICE: "TRINO_SERVICE",
  }),
  REMIX: createUpperSamePairedObject({
    KEYCLOAK_ADMIN: "KEYCLOAK_ADMIN",
    OPENFGA_CLIENT: "OPENFGA_CLIENT",
    SHIELD_API: "SHIELD_API",
  }),
} as const satisfies Record<Apps, Record<Uppercase<string>, Uppercase<string>>>;

type SingletonKey = { [A in Apps]: (typeof SINGLETON_KEYS)[A][keyof (typeof SINGLETON_KEYS)[A]] }[Apps];

declare global {
  var __singletons: Record<SingletonKey, unknown>;
}

export const asyncSingleton = async <Value>(name: SingletonKey, value: () => Promise<Value>): Promise<Value> => {
  global.__singletons = global.__singletons || {};

  if (!global.__singletons[name]) {
    global.__singletons[name] = await value();
  }

  return global.__singletons[name] as Value;
};

export const singleton = <Value>(name: SingletonKey, value: () => Value): Value => {
  global.__singletons = global.__singletons || {};

  if (!global.__singletons[name]) {
    global.__singletons[name] = value();
  }

  return global.__singletons[name] as Value;
};
