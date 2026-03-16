import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Db } from "mongodb";
import { Requests } from "./requests.interface";
import { DB_CONNECTION_PROVIDER } from "src/utils/constants";

@Injectable()
export class RequestsService {
  constructor(
    /**@deprecated */
    @Inject(DB_CONNECTION_PROVIDER)
    private db: Db,
  ) {}

  async getAllRequests(): Promise<Requests[]> {
    const requests = await this.db.collection<Requests>("requests").find().toArray();

    if (requests.length < 1) throw new NotFoundException();

    return requests;
  }

  async getRequestByUser(userId: string): Promise<Requests[]> {
    const requests = await this.db.collection<Requests>("requests").find({ user_id: userId }).toArray();

    if (requests.length < 1) throw new NotFoundException();

    return requests;
  }
}
