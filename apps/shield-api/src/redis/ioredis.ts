import { Injectable, Logger } from "@nestjs/common";
import { Redis } from "ioredis";
import redisMock from "ioredis-mock";

const isMock = process.env.ENV?.toLowerCase() === "local";
const Extended = isMock ? redisMock : Redis;

@Injectable()
export class IORedis extends Extended {
  private readonly logger = new Logger(IORedis.name);

  constructor() {
    super({ host: process.env.REDIS_HOST, password: process.env.REDIS_PASSWORD });

    this.logger.log("Constructing redis client...");

    super.on("connect", () => {
      this.logger.log(`Successfully connected to Redis! (using mock: ${isMock})`);
    });

    super.on("error", (error) => {
      this.logger.error(error);
    });
  }
}
