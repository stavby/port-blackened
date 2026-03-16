import { transformUsername } from "@port/utils";
import { Transform } from "class-transformer";
import { IsString } from "class-validator";
import z from "zod";

export const userIdSchema = z
  .string()
  .toLowerCase()
  .nonempty()
  .transform(transformUsername)
  .refine(
    (username): username is string => username !== undefined,
    (username) => ({ message: `המזהה ${username} אינו תקין` }),
  )
  .brand("UserID");

export type UserID = z.infer<typeof userIdSchema>;

export const preferredUsernameSchema = z.string().brand("PreferredUsername");

export type PreferredUsername = z.infer<typeof preferredUsernameSchema>;

export const baseOwnerSchema = z.object({ name: z.string() });

export const ownerSchema = baseOwnerSchema.extend({ id: userIdSchema });

export type Owner = z.infer<typeof ownerSchema>;

export const preferredOwnerSchema = baseOwnerSchema.extend({ id: preferredUsernameSchema });

export type PreferredOwner = z.infer<typeof preferredOwnerSchema>;

export const anyOwnerSchema = baseOwnerSchema.extend({ id: z.string() });

export type AnyOwner = z.infer<typeof anyOwnerSchema>;

export function UserIDTransform(options?: { isArray?: boolean }): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Transform((value) => (options?.isArray ? userIdSchema.array().parse(value) : userIdSchema.parse(value)))(target, propertyKey);
    IsString({ each: options?.isArray })(target, propertyKey);
  };
}
