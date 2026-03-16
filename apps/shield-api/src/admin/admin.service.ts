import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { OpenFgaService } from "src/openfga/openfga.service";
import { ManageWritePermissionsToUserDTO } from "./admin.models";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "@port/shield-models";
import { formatFGAObjectId, PLATFORM_FGA_INSTANCE } from "@port/openfga-client";
import { DATALAKE_CATALOG_NAME } from "@port/common-schemas";
import { cloneDeep } from "lodash";
import { IORedis } from "src/redis/ioredis";
import { REDIS_KEYS } from "src/redis/ioredis.keys";
import { createServiceLogger } from "@port/logger";

@Injectable()
/** @important Only Admin Users Should Use This Service! */
export class AdminService {
  private readonly logger = createServiceLogger(AdminService.name);
  constructor(
    private readonly openFgaService: OpenFgaService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly ioredis: IORedis,
  ) {}

  private async invalidateUsersDictCache() {
    try {
      await this.ioredis.del(REDIS_KEYS.USERS_DICT);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async createFGASchemaObject(schema_name: string) {
    await this.openFgaService.writeTuples(this.openFgaService.generateSchemaHierarchy(schema_name));
  }

  async giveWritePermissionsOnSchemaToUser({ user_id, schema_name }: ManageWritePermissionsToUserDTO): Promise<void> {
    const user = await this.userModel.findOne({ user_id }, { user_id: true, catalogs: true });
    if (!user) throw new BadRequestException(`User ${user_id} not found in collection`);
    const isSchemaExistsInOpenFGA = await this.openFgaService.check({
      user: PLATFORM_FGA_INSTANCE,
      relation: "platform",
      object: formatFGAObjectId({ type: "schema", id: schema_name }),
    });
    if (!isSchemaExistsInOpenFGA.allowed) throw new BadRequestException(`Schema ${schema_name} does not exist in OpenFGA`);

    const userDatalakeCatalog = user.catalogs.get(DATALAKE_CATALOG_NAME);
    const rollbackSchemas = userDatalakeCatalog.schemas?.length ? cloneDeep(userDatalakeCatalog.schemas) : undefined;
    const existingSchemaValue = userDatalakeCatalog.schemas?.find((schema) => schema.schema_name === schema_name);
    if (existingSchemaValue?.write) {
      throw new ConflictException(`User already has write permissions on schema ${schema_name} in catalog ${DATALAKE_CATALOG_NAME}`);
    }
    if (existingSchemaValue) {
      existingSchemaValue.write = true;
    } else {
      userDatalakeCatalog.schemas?.push({ schema_name, write: true });
    }

    user.catalogs.set(DATALAKE_CATALOG_NAME, userDatalakeCatalog);
    await user.save();

    try {
      await this.openFgaService.writeTuples([
        {
          user: formatFGAObjectId({ type: "user", id: user_id }),
          relation: "can_write",
          object: formatFGAObjectId({ type: "schema", id: schema_name }),
        },
      ]);
    } catch (error) {
      userDatalakeCatalog.schemas = rollbackSchemas;
      user.catalogs.set(DATALAKE_CATALOG_NAME, userDatalakeCatalog);
      await user.save();
      throw error;
    }

    this.invalidateUsersDictCache();
  }

  async revokeWritePermissionsOnSchemaFromUser({ user_id, schema_name }: ManageWritePermissionsToUserDTO): Promise<void> {
    const user = await this.userModel.findOne({ user_id }, { user_id: true, catalogs: true });
    if (!user) throw new BadRequestException(`User ${user_id} not found in collection`);

    const userDatalakeCatalog = user.catalogs.get(DATALAKE_CATALOG_NAME);
    const existingSchemaValue = userDatalakeCatalog.schemas?.find((schema) => schema.schema_name === schema_name);

    const rollbackSchemas = userDatalakeCatalog.schemas?.length ? cloneDeep(userDatalakeCatalog.schemas) : undefined;
    if (!existingSchemaValue) throw new BadRequestException(`Schema ${schema_name} not found for user ${user_id}`);
    existingSchemaValue.write = false;

    user.catalogs.set(DATALAKE_CATALOG_NAME, userDatalakeCatalog);
    await user.save();

    try {
      await this.openFgaService.deleteTuples([
        {
          user: formatFGAObjectId({ type: "user", id: user_id }),
          relation: "can_write",
          object: formatFGAObjectId({ type: "schema", id: schema_name }),
        },
      ]);
    } catch (error) {
      userDatalakeCatalog.schemas = rollbackSchemas;
      user.catalogs.set(DATALAKE_CATALOG_NAME, userDatalakeCatalog);
      await user.save();
      throw error;
    }

    this.invalidateUsersDictCache();
  }
}
