import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { TrinoService } from "src/trino/trino.service";
import { GetFullUserInfoDto, GetUserInfoDto } from "./user-info.interface";
import { IORedis } from "src/redis/ioredis";
import { REDIS_KEYS } from "src/redis/ioredis.keys";
import { KEYCLOAK_ADMIN_PROVIDE } from "./keycloak-admin.provider";
import { KeycloakAdmin, KeycloakUserDto } from "@port/keycloak-admin";
import { UserID } from "@port/common-schemas";

const HR_GENERAL_INFO_COLUMNS = [
  "mispar_ishi",
  "shem_male",
  "shem_darga",
  "shem_yechida",
  "cell_phone",
  "tatash_date",
  "sabat",
  "shem_isuk",
] as const;

type HrGeneralInfoColumn = (typeof HR_GENERAL_INFO_COLUMNS)[number];

@Injectable()
export class UserInfoService {
  private readonly logger = new Logger(UserInfoService.name);
  constructor(
    private readonly trinoService: TrinoService,
    private readonly ioredis: IORedis,
    @Inject(KEYCLOAK_ADMIN_PROVIDE) private readonly keycloakAdmin: KeycloakAdmin,
  ) {}

  /**
   * @throws {NotFoundException} from external keycloak
   */
  private async getKeycloakUserByUserId(user_id: UserID, useCache: boolean): Promise<KeycloakUserDto> {
    const redisKey = REDIS_KEYS.KEYCLOAK_USER(user_id);

    if (useCache) {
      const redisValue = await this.ioredis.get(redisKey);
      if (redisValue) {
        return JSON.parse(redisValue);
      }
    }

    const user = await this.keycloakAdmin.getUserByUsername(user_id);

    if (!user) {
      throw new NotFoundException(`User with user_id ${user_id} not found in keycloak`);
    }

    await this.ioredis.set(redisKey, JSON.stringify(user), "EX", 60 * 60);

    return user;
  }

  private async getTrinoUserDataByUserId(user_id: string, useCache: boolean) {
    const redisKey = REDIS_KEYS.TRINO_USER_DATA(user_id);

    if (useCache) {
      const redisValue = await this.ioredis.get(redisKey);
      if (redisValue) {
        return JSON.parse(redisValue);
      }
    }

    const userIdWithoutPrefix = UserInfoService.getUserIdWithoutPrefix(user_id);

    if (!isNaN(userIdWithoutPrefix)) {
      return {};
    }

    const TRINO_USERINFO_KEYS = ["cell_phone", "tatash_date", "sabat", "shem_isuk"] as const satisfies (keyof GetFullUserInfoDto)[];

    const statementName = "get_trino_users_data_by_user_ids";
    const statement = `
      SELECT ${TRINO_USERINFO_KEYS.join(",")}
      FROM <redacted>
      WHERE mispar_ishi = ?
    `;

    const res = await this.trinoService.executePreparedStatement<{ [key in (typeof TRINO_USERINFO_KEYS)[number]]: string }>(
      statement,
      statementName,
      userIdWithoutPrefix,
    );

    const userInfoTrino = res[0] ?? {};

    this.ioredis.set(redisKey, JSON.stringify(userInfoTrino), "EX", 60 * 60);

    return userInfoTrino;
  }

  /**
   * Important! This function is vulnerable to sql injection! Use with caution
   */
  async getTrinoUsersDataByUserIds<const Columns extends HrGeneralInfoColumn[]>(userIds: string[], columns: Columns) {
    if (userIds.length === 0) {
      return [];
    }

    const userIdsWithoutPrefix = userIds.reduce<number[]>((acc, userId) => {
      const userIdWithoutPrefix = UserInfoService.getUserIdWithoutPrefix(userId);

      if (!isNaN(userIdWithoutPrefix)) {
        acc.push(userIdWithoutPrefix);
      }

      return acc;
    }, []);

    // BLACKEND - table name
    const query = `
      SELECT ${columns.join(",")}
      FROM datalake.public.mock_users
      WHERE mispar_ishi IN (${userIdsWithoutPrefix.join(",")})
    `;

    const usersTrinoData = await this.trinoService.query<{ [key in Columns[number]]: string }>(query);

    return usersTrinoData;
  }

  /**
   * @throws {NotFoundException} from external keycloak api
   */
  async getUserInfoByUserId(user_id: UserID, useCache: boolean): Promise<GetUserInfoDto> {
    const keycloakUser = await this.getKeycloakUserByUserId(user_id, useCache);

    return this.keycloakUserToUserInfoDto(keycloakUser);
  }

  /**
   * This function recieves basic user info from keycloak
   * Next, it fetch additional info fields from Trino if the user is 's' or 'c'
   * @throws {NotFoundException} from external keycloak
   */
  async getFullUserInfoByUserId(user_id: UserID, useCache: boolean): Promise<GetFullUserInfoDto> {
    const keycloakUserData = await this.getKeycloakUserByUserId(user_id, useCache);

    const userInfoAd = {
      user_id: keycloakUserData.userId,
      first_name: keycloakUserData.firstName,
      last_name: keycloakUserData.lastName,
      shem_yechida: keycloakUserData.shemYechida,
      shem_sug_sherut: keycloakUserData.shemSugSherut,
      shem_darga: keycloakUserData.shemDarga,
      preferred_username: keycloakUserData.preferredUsername,
    };

    const isUserAatz = user_id.startsWith("c");

    // query trino for regular ('s') and aatz ('c) users
    if (user_id.startsWith("s") || isUserAatz) {
      try {
        const trinoUserInfo = await this.getTrinoUserDataByUserId(user_id, useCache);

        return { ...trinoUserInfo, ...userInfoAd };
      } catch (error) {
        this.logger.warn(new Error("Failed to get trino user data", { cause: error }));
      }
    }

    return userInfoAd;
  }

  static getUserIdWithoutPrefix(user_id: string): number {
    // trino is searching by mispar ishi without prefix
    const userIdWithoutPrefix = user_id.slice(1);
    // trino is searching aatz users with prefix of digit 9
    if (user_id.startsWith("c")) {
      return Number(`9${userIdWithoutPrefix}`);
    }
    return Number(userIdWithoutPrefix);
  }

  async searchUsers(search: string, useCache: boolean): Promise<GetUserInfoDto[]> {
    const redisKey = REDIS_KEYS.KEYCLOAK_SEARCH(search);

    if (useCache) {
      const redisValue = await this.ioredis.get(redisKey);
      if (redisValue) {
        return JSON.parse(redisValue);
      }
    }

    const users = await this.keycloakAdmin.searchUsers(search);
    const formattedData = users.map(this.keycloakUserToUserInfoDto);

    this.ioredis.set(redisKey, JSON.stringify(formattedData), "EX", 60 * 60);

    return formattedData;
  }

  private keycloakUserToUserInfoDto(
    keycloakUser: Pick<KeycloakUserDto, "userId" | "firstName" | "lastName" | "preferredUsername">,
  ): GetUserInfoDto {
    return {
      user_id: keycloakUser.userId,
      preferred_username: keycloakUser.preferredUsername,
      first_name: keycloakUser.firstName,
      last_name: keycloakUser.lastName,
    };
  }
}
