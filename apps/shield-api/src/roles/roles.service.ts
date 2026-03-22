import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FGARelation } from "@port/openfga-client";
import { Role as MongooseRole } from "@port/shield-models";
import { NON_ADMIN_ROLE_NAMES, ROLE_NAME, RoleName } from "@port/shield-schemas";
import { ObjectId, WithId } from "mongodb";
import { Model } from "mongoose";
import { Role } from "./roles.classes";
import { getRolesDtoWithObjectIdTransform, ZGetRolesDto, ZGetRolesFgaPermissionMappingDto } from "./roles.dto";

@Injectable()
export class RolesService {
  constructor(@InjectModel(MongooseRole.name) private readonly roleModel: Model<MongooseRole>) {}

  async getRoleById(roleID: ObjectId): Promise<WithId<Role> | null> {
    return await this.roleModel.findOne({ _id: roleID }).exec();
  }

  async getRoleByName(roleName: string): Promise<WithId<Role> | null> {
    return await this.roleModel.findOne({ name: roleName }).exec();
  }

  async getRolesByNames(roleNames: readonly string[]): Promise<WithId<Role>[]> {
    return await this.roleModel.find({ name: { $in: roleNames } }).exec();
  }

  async getAllRoles(): Promise<WithId<Role>[]> {
    return await this.roleModel.find().exec();
  }
  async getNonAdminRoles(): Promise<ZGetRolesDto> {
    const roles = await this.roleModel
      .find({ name: { $in: NON_ADMIN_ROLE_NAMES } })
      .sort({ display_order: "asc" })
      .exec();

    return getRolesDtoWithObjectIdTransform.parse(roles);
  }

  async getRolesFgaPermissionMapping(): Promise<ZGetRolesFgaPermissionMappingDto> {
    const fgaPermissions = {
      can_update_datalake: [ROLE_NAME.analyst, ROLE_NAME.implementor, ROLE_NAME.kapat],
      can_document: [ROLE_NAME.analyst, ROLE_NAME.implementor, ROLE_NAME.kapat, ROLE_NAME.documentator],
      can_manage_documentators: [ROLE_NAME.rav_amlach, ROLE_NAME.amlach],
      can_manage_implementors: [ROLE_NAME.kapat],
      can_manage_amlachs: [ROLE_NAME.rav_amlach],
      can_manage_support_centers: [ROLE_NAME.rav_amlach, ROLE_NAME.amlach],
      can_manage_analysts: [ROLE_NAME.rav_amlach, ROLE_NAME.amlach],
      can_manage_api_users: [ROLE_NAME.rav_amlach, ROLE_NAME.amlach],
      can_manage_data_permissions: [ROLE_NAME.amlach, ROLE_NAME.rav_amlach, ROLE_NAME.support_center, ROLE_NAME.api_user],
      can_classify_tables: [ROLE_NAME.amlach, ROLE_NAME.rav_amlach],
      can_manage_user_mask_indications: [ROLE_NAME.amlach, ROLE_NAME.rav_amlach, ROLE_NAME.support_center, ROLE_NAME.api_user],
      can_manage_user_deceased_indications: [ROLE_NAME.rav_amlach],
      can_create_permission_group: [ROLE_NAME.amlach, ROLE_NAME.rav_amlach, ROLE_NAME.support_center],
    } as const satisfies Partial<Record<FGARelation, RoleName[]>>;

    const fgaPermissionCategories: ZGetRolesFgaPermissionMappingDto = [
      {
        categoryName: "connect",
        categoryDisplayName: "קונקט",
        fgaPermissions: [
          { name: "can_update_datalake", displayName: "יצירה ועדכון זרימות", roles: fgaPermissions.can_update_datalake },
          { name: "can_document", displayName: "תיעוד זרימות", roles: fgaPermissions.can_document },
        ],
      },
      {
        categoryName: "remix",
        categoryDisplayName: "רימיקס",
        fgaPermissions: [
          { name: "can_update_datalake", displayName: "יצירה ועדכון מיקסים", roles: fgaPermissions.can_update_datalake },
          {
            name: "can_document",
            displayName: "תיעוד מיקסים",
            roles: [...fgaPermissions.can_document, ROLE_NAME.amlach, ROLE_NAME.rav_amlach],
          },
        ],
      },
      {
        categoryName: "shield",
        categoryDisplayName: "שילד",
        fgaPermissions: [
          { name: "can_manage_data_permissions", displayName: "עדכון הרשאות דאטה", roles: fgaPermissions.can_manage_data_permissions },
          { name: "can_classify_tables", displayName: "סיווג טבלאות", roles: fgaPermissions.can_classify_tables },
          {
            name: "can_manage_user_mask_indications ",
            displayName: "התממה למשתמשים",
            roles: fgaPermissions.can_manage_user_mask_indications,
          },
          {
            name: "can_manage_user_deceased_indications",
            displayName: "נפטרים למשתמשים",
            roles: fgaPermissions.can_manage_user_deceased_indications,
          },
        ],
      },
      {
        categoryName: "management",
        categoryDisplayName: "ניהול משתמשים",
        fgaPermissions: [
          { name: "can_manage_documentators ", displayName: "ניהול מתעדים", roles: fgaPermissions.can_manage_documentators },
          { name: "can_manage_implementors ", displayName: "ניהול מיישמים", roles: fgaPermissions.can_manage_implementors },
          { name: "can_manage_amlachs ", displayName: 'ניהול אמלח"ים', roles: fgaPermissions.can_manage_amlachs },
          { name: "can_manage_support_centers ", displayName: "ניהול מרכז תמיכה", roles: fgaPermissions.can_manage_support_centers },
          { name: "can_manage_api_users", displayName: "ניהול משתמשי API", roles: fgaPermissions.can_manage_api_users },
          { name: "can_manage_analysts", displayName: "ניהול אנליסטים", roles: fgaPermissions.can_manage_analysts },
        ],
      },
    ];

    return fgaPermissionCategories;
  }
}
