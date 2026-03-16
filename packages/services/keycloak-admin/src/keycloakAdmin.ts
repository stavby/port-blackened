import KeycloakAdminClient from "@keycloak/keycloak-admin-client";
import UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js";
import { Credentials } from "@keycloak/keycloak-admin-client/lib/utils/auth.js";
import { KeycloakConfig, KeycloakUserDto } from "./interfaces.ts";
import { preferredUsernameSchema, type UserID, userIdSchema } from "@port/common-schemas";

const hasKey = <Key extends string>(obj: unknown, key: Key): obj is Record<Key, unknown> => {
  return obj !== null && typeof obj === "object" && key in obj;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Authenticated = <T extends (...args: any[]) => Promise<unknown>>(
  _target: unknown,
  _propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>,
): TypedPropertyDescriptor<T> => {
  const method = descriptor.value!;

  descriptor.value = async function (this: KeycloakAdmin, ...args: unknown[]) {
    try {
      return await method.apply(this, args);
    } catch (error) {
      if (hasKey(error, "response") && hasKey(error.response, "status") && error.response.status === 401) {
        await this.authenticate();
        return await method.apply(this, args);
      }

      throw error;
    }
  } as T;

  return descriptor;
};

export class KeycloakAdmin {
  private readonly keycloakAdminClient: KeycloakAdminClient;
  private readonly clientId: string;
  private readonly clientSecret: string;

  private constructor({ baseUrl, realmName, clientId, clientSecret }: KeycloakConfig) {
    this.keycloakAdminClient = new KeycloakAdminClient({
      baseUrl,
      realmName,
    });

    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async authenticate(): Promise<void> {
    const credentials: Credentials = {
      grantType: "client_credentials",
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    };

    await this.keycloakAdminClient.auth(credentials);
  }

  static async build(config: KeycloakConfig): Promise<KeycloakAdmin> {
    const newInstance = new KeycloakAdmin(config);

    await newInstance.authenticate();

    return newInstance;
  }

  private toKeycloakUserDto(user: UserRepresentation): KeycloakUserDto | null {
    if (!user.username) {
      return null;
    }

    const parsedUserId = userIdSchema.parse(user.username);

    if (!parsedUserId) {
      return null;
    } else {
      return {
        userId: parsedUserId,
        preferredUsername: preferredUsernameSchema.parse(user.username),
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : parsedUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        shemYechida: user.attributes?.shemYechida,
        shemDarga: user.attributes?.shemDarga,
        shemSugSherut: user.attributes?.shemSugSherut,
      };
    }
  }

  private toKeycloaskUserDtoArray(users: UserRepresentation[]): KeycloakUserDto[] {
    const uniqueUsers = new Map<string, KeycloakUserDto>();

    for (const user of users) {
      const userDto = this.toKeycloakUserDto(user);

      if (userDto) {
        uniqueUsers.set(userDto.userId, userDto);
      }
    }

    return Array.from(uniqueUsers.values());
  }

  /**
   * Must provide full username as it's not exact for matching usernames that are also emails
   *
   * @param username
   * @returns KeycloakUserDto or null
   */
  @Authenticated
  async searchUsers(search: string, max: number = 10): Promise<KeycloakUserDto[]> {
    const users = await this.keycloakAdminClient.users.find({ search, max });

    return this.toKeycloaskUserDtoArray(users);
  }

  @Authenticated
  async getUserByUsername(username: UserID): Promise<KeycloakUserDto | null> {
    const users = await this.keycloakAdminClient.users.find({ username, max: 1, exact: false });

    if (users.length === 0) {
      return null;
    }
    const user = users[0]!;

    return this.toKeycloakUserDto(user);
  }

  @Authenticated
  async getUsersByClientRole(roleName: string): Promise<KeycloakUserDto[]> {
    const clients = await this.keycloakAdminClient.clients.find({ clientId: this.clientId, max: 1 });
    const client = clients[0];

    if (!client || !client.id) {
      throw new Error(`Error: No Id for client ${this.clientId}`);
    }

    const users = await this.keycloakAdminClient.clients.findUsersWithRole({ id: client.id, roleName: roleName });

    return this.toKeycloaskUserDtoArray(users);
  }
}
