import { logger } from "@port/logger";

type RollbackFn = () => Promise<unknown>;
type RegisterRollbackFn = (rollback: RollbackFn, name: string) => unknown;

export const withRollbacks = async <T>(fn: (registerRollback: RegisterRollbackFn) => Promise<T>): Promise<T> => {
  const rollbacks: RollbackFn[] = [];

  const registerRollback: RegisterRollbackFn = (rollback, name) => {
    rollbacks.unshift(async () => {
      try {
        await rollback();
      } catch (error) {
        logger.error(new Error(`Rollback Failed ${name}`, { cause: error }));
      }
    });
  };

  try {
    return await fn(registerRollback);
  } catch (error) {
    await Promise.all(rollbacks.map((rollback) => rollback()));
    throw error;
  }
};
