import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Db, UpdateResult } from "mongodb";
import { Secret } from "./secret.interface";
import { DB_CONNECTION_PROVIDER } from "src/utils/constants";

@Injectable()
export class SecretService {
  constructor(/**@deprecated */ @Inject(DB_CONNECTION_PROVIDER) private db: Db) {}

  async getSecret(): Promise<Secret> {
    const secret = await this.db.collection<Secret>("secret").findOne();
    if (!secret) throw new NotFoundException();

    return secret;
  }

  async generateNewSecret(): Promise<UpdateResult<Secret>> {
    // generate random string
    const newSecret = Math.random().toString(36).substring(2, 12);

    const secret = await this.db.collection<Secret>("secret").updateOne({ _id: this.getSecret }, { $set: { secret: newSecret } });
    if (!secret) throw new NotFoundException();

    return secret;
  }
}
