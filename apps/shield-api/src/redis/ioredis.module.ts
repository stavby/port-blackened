import { Global, Logger, Module } from "@nestjs/common";
import { IORedis } from "./ioredis";

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: IORedis,
      useFactory: () => {
        const redis = new IORedis();

        return new Proxy(redis, {
          get(target, prop, receiver) {
            const safeMethods = new Set(["get", "set", "del"]);
            const origin = Reflect.get(target, prop, receiver);

            if (typeof origin !== "function" || !safeMethods.has(prop.toString())) {
              return origin;
            } else {
              return async (...args: unknown[]) => {
                try {
                  return await origin.apply(target, args);
                } catch (error) {
                  Logger.error(new Error("IO Redis error", { cause: error }));
                }
              };
            }
          },
        });
      },
    },
  ],
  exports: [IORedis],
})
export class IORedisModule {}
