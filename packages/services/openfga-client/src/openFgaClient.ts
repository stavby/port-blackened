import {
  ClientListRelationsRequest,
  ClientRequestOpts,
  ClientWriteResponse,
  ConsistencyOpts,
  OpenFgaClient,
  PaginationOptions,
  StoreIdOpts,
} from "@openfga/sdk";
import { FGATupleKey, formatFGAObjectId } from "./generated/fga-types.ts";
import {
  ConnectionRole,
  DomainRole,
  FGAClientCheckRequest,
  FGAClientListObjectsRequest,
  FGAClientListUsersRequest,
  FgaClientWriteRequest,
  FGAReadRequestTupleKey,
  FGAReadResponse,
  FGATuple,
  FGATupleKeyWithoutCondition,
  TailParameters,
} from "./types.ts";
import { PLATFORM_FGA_INSTANCE } from "./utils.ts";
import { chunk } from "lodash";
import { PromiseResult } from "@openfga/sdk/dist/common.js";
import { UserID } from "@port/common-schemas";

/**
 * A client for interacting with the OpenFGA API. This class extends the base OpenFGA client and provides additional functionality or customizations.
 * Includes utility methods for writing tuples to the store safely.
 * Maps Typescript types to OpenFGA's schema definition, handles authentication using an API token.
 *
 * @class OpenFgaPortClient
 * @extends {OpenFgaClient}
 */
export class OpenFgaPortClient extends OpenFgaClient {
  private readonly MAX_TUPLES_CHUNK_SIZE = 100;

  write(body: FgaClientWriteRequest, ...rest: TailParameters<OpenFgaClient["write"]>) {
    return super.write(body, ...rest);
  }

  async writeBatch(body: FgaClientWriteRequest, ...rest: TailParameters<OpenFgaClient["write"]> & { maxTuplesPerRequest?: number }) {
    const chunkSize = rest.maxTuplesPerRequest || this.MAX_TUPLES_CHUNK_SIZE;

    if (chunkSize > this.MAX_TUPLES_CHUNK_SIZE) {
      throw new Error(`maxTuplesPerRequest cannot exceed ${this.MAX_TUPLES_CHUNK_SIZE}`);
    }

    const allTuples: ({ type: "write"; tuple: FGATupleKey } | { type: "delete"; tuple: FGATupleKeyWithoutCondition })[] = [
      ...(body.writes?.map<{ type: "write"; tuple: FGATupleKey }>((tuple) => ({ type: "write", tuple })) ?? []),
      ...(body.deletes?.map<{ type: "delete"; tuple: FGATupleKeyWithoutCondition }>((tuple) => ({ type: "delete", tuple })) ?? []),
    ];

    const chunks = chunk(allTuples, chunkSize);

    for (const chunk of chunks) {
      const request: Required<FgaClientWriteRequest> = { writes: [], deletes: [] };
      for (const { type, tuple } of chunk) {
        if (type === "write") {
          request.writes.push(tuple);
        } else {
          request.deletes.push(tuple);
        }
      }

      await super.write(request, ...rest);
    }
  }

  async read(body?: FGAReadRequestTupleKey, ...rest: TailParameters<OpenFgaClient["read"]>): PromiseResult<FGAReadResponse> {
    return (await super.read(body, ...rest)) as unknown as PromiseResult<FGAReadResponse>;
  }

  writeTuples(tuples: FGATupleKey[], ...rest: TailParameters<OpenFgaClient["writeTuples"]>) {
    return super.writeTuples(tuples, ...rest);
  }

  async writeTuplesBatch(tuples: FGATupleKey[], ...rest: TailParameters<OpenFgaClient["writeTuples"]> & { maxTuplesPerRequest?: number }) {
    const chunkSize = rest.maxTuplesPerRequest || this.MAX_TUPLES_CHUNK_SIZE;

    if (chunkSize > this.MAX_TUPLES_CHUNK_SIZE) {
      throw new Error("maxTuplesPerRequest cannot exceed 100");
    }
    const chunks = chunk(tuples, chunkSize);

    for (const chunk of chunks) {
      await this.writeTuples(chunk, ...rest);
    }
  }

  deleteTuples(tuples: FGATupleKeyWithoutCondition[], ...rest: TailParameters<OpenFgaClient["deleteTuples"]>) {
    return super.deleteTuples(tuples, ...rest);
  }

  async deleteTuplesBatch(tuples: FGATupleKey[], ...rest: TailParameters<OpenFgaClient["writeTuples"]> & { maxTuplesPerRequest?: number }) {
    const chunkSize = rest.maxTuplesPerRequest || this.MAX_TUPLES_CHUNK_SIZE;

    if (chunkSize > this.MAX_TUPLES_CHUNK_SIZE) {
      throw new Error("maxTuplesPerRequest cannot exceed 100");
    }
    const chunks = chunk(tuples, chunkSize);

    for (const chunk of chunks) {
      await this.deleteTuples(chunk, ...rest);
    }
  }

  listObjects(body: FGAClientListObjectsRequest, ...rest: TailParameters<OpenFgaClient["listObjects"]>) {
    return super.listObjects(body, ...rest);
  }

  listRelations(listRelationsRequest: ClientListRelationsRequest, ...rest: TailParameters<OpenFgaClient["listRelations"]>) {
    return super.listRelations(listRelationsRequest, ...rest);
  }

  check(body: FGAClientCheckRequest, ...rest: TailParameters<OpenFgaClient["check"]>) {
    return super.check(body, ...rest);
  }

  listUsers(body: FGAClientListUsersRequest, ...rest: TailParameters<OpenFgaClient["listUsers"]>) {
    return super.listUsers(body, ...rest);
  }

  createPlatformAdmin(userId: string): Promise<ClientWriteResponse> {
    return this.writeTuples([{ user: formatFGAObjectId({ type: "user", id: userId }), relation: "admin", object: PLATFORM_FGA_INSTANCE }]);
  }

  async readAll(
    body?: FGAReadRequestTupleKey,
    options?: ClientRequestOpts & StoreIdOpts & PaginationOptions & ConsistencyOpts,
  ): Promise<FGATuple[]> {
    let continuationToken = null;
    let done = false;
    const allTuples: FGATuple[] = [];
    while (!done) {
      const { tuples, continuation_token } = await this.read(body, { ...options, continuationToken: continuationToken ?? undefined });
      done = !continuation_token || continuation_token === continuationToken;
      continuationToken = continuation_token || null;
      allTuples.push(...tuples);
    }
    return allTuples;
  }

  generateAdminTuple(userId: string): FGATupleKey {
    return {
      user: formatFGAObjectId({ type: "user", id: userId }),
      relation: "admin",
      object: PLATFORM_FGA_INSTANCE,
    };
  }

  async isAdmin(userId: UserID): Promise<boolean> {
    return !!(await this.check(this.generateAdminTuple(userId))).allowed;
  }

  generateDomainHeirarchy(domainId: string): FGATupleKey[] {
    return [{ user: PLATFORM_FGA_INSTANCE, relation: "platform", object: formatFGAObjectId({ type: "domain", id: domainId }) }];
  }

  generateDomainClassificationHeirarchy(domainId: string, classificationId: string): FGATupleKey[] {
    return [
      {
        user: formatFGAObjectId({ type: "domain", id: domainId }),
        relation: "domain",
        object: formatFGAObjectId({ type: "domain_classification", id: `${domainId}-${classificationId}` }),
      },
    ];
  }

  generateSchemaHierarchy(schema_name: string): FGATupleKey[] {
    return [{ user: PLATFORM_FGA_INSTANCE, relation: "platform", object: formatFGAObjectId({ id: schema_name, type: "schema" }) }];
  }

  assignDomainRoleToUser(userId: string, domainId: string, role: DomainRole): Promise<ClientWriteResponse> {
    return this.writeTuples([
      {
        user: formatFGAObjectId({ type: "user", id: userId }),
        relation: role,
        object: formatFGAObjectId({ type: "domain", id: domainId }),
      },
    ]);
  }

  assignDomainsRolesToUser(
    userId: UserID,
    domains: { id: string; role: DomainRole; classificationIds: string[] }[],
  ): Promise<ClientWriteResponse> {
    return this.writeTuples(
      domains.flatMap<FGATupleKey>((domain) => [
        {
          user: formatFGAObjectId({ type: "user", id: userId }),
          relation: domain.role,
          object: formatFGAObjectId({ type: "domain", id: domain.id }),
        },
        ...domain.classificationIds.map<FGATupleKey>((classificationId) => ({
          user: formatFGAObjectId({ type: "user", id: userId }),
          relation: "assigner",
          object: formatFGAObjectId({ type: "domain_classification", id: `${domain.id}-${classificationId}` }),
        })),
      ]),
    );
  }

  assignConnectionRoleToUser(connectionId: string, userId: UserID, role: ConnectionRole) {
    return this.writeTuples([
      {
        user: formatFGAObjectId({ type: "user", id: userId }),
        relation: `role_${role}`,
        object: formatFGAObjectId({ type: "connection", id: connectionId }),
      },
    ]);
  }

  assignConnectionRolesToUsers(connectionId: string, users: { id: UserID; role: ConnectionRole }[]) {
    return this.writeTuples(
      users.map((user) => ({
        user: formatFGAObjectId({ type: "user", id: user.id }),
        relation: `role_${user.role}`,
        object: formatFGAObjectId({ type: "connection", id: connectionId }),
      })),
    );
  }

  generateCanCreateConnectionsTuple(userId: string): FGATupleKey {
    return {
      user: formatFGAObjectId({ type: "user", id: userId }),
      relation: "can_create_connections",
      object: PLATFORM_FGA_INSTANCE,
    };
  }

  generateCanManageUniquePopulationIndicationsTuple(userId: string): FGATupleKey {
    return {
      user: formatFGAObjectId({ type: "user", id: userId }),
      relation: "can_manage_unique_population_indications",
      object: PLATFORM_FGA_INSTANCE,
    };
  }

  generateConnectionHeirarchyTuples(connectionId: number): FGATupleKey[] {
    return [
      { user: PLATFORM_FGA_INSTANCE, relation: "platform", object: formatFGAObjectId({ type: "connection", id: connectionId.toString() }) },
    ];
  }

  generateFlowHierarchyTuples(flowId: number, connectionId: number, domainId: string): FGATupleKey[] {
    return [
      {
        user: formatFGAObjectId({ type: "connection", id: connectionId.toString() }),
        relation: "connection",
        object: formatFGAObjectId({ type: "flow", id: flowId.toString() }),
      },
      {
        user: formatFGAObjectId({ type: "domain", id: domainId.toString() }),
        relation: "domain",
        object: formatFGAObjectId({ type: "flow", id: flowId.toString() }),
      },
    ];
  }

  generateMixHeirarchy(domainId: string, mixId: string): FGATupleKey[] {
    return [
      {
        user: formatFGAObjectId({ type: "domain", id: domainId }),
        relation: "domain",
        object: formatFGAObjectId({ type: "mix", id: mixId }),
      },
    ];
  }

  generateOwnershipTuple(userId: UserID, objectType: "flow" | "mix", objectId: string): FGATupleKey {
    return {
      user: formatFGAObjectId({ type: "user", id: userId }),
      relation: "owner",
      object: formatFGAObjectId({ type: objectType, id: objectId.toString() }),
    };
  }
}
