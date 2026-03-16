import { Box, Button, FormControl, FormHelperText, FormLabel, TextField } from "@mui/material";
import { Key } from "@phosphor-icons/react";
import { Dispatch } from "react";
import { GeneralPopup } from "../Popup";
import { PermissionGroupForm, PermissionGroupFormSchema } from "../../types/permission_groups";
import { MultiUserSelector, UsersAutocomplete } from "..";
import { useController, useForm } from "react-hook-form";
import { useLoggedUserInfo } from "@api/auth";
import { GetUserInfoDto } from "@types";
import { useGetLoggedUserPermissionsOnGroup } from "@api/permissionGroups";
import { uniqBy } from "lodash";
import { PermissionGroupsDto } from "@port/shield-schemas";
import { zodResolver } from "@hookform/resolvers/zod";

type EditPermissionGroupsPopupProps = {
  openModal: boolean;
  setOpenModal: Dispatch<React.SetStateAction<boolean>>;
  title: string;
  cancel: () => void;
  onSubmit: (permissionGroup: PermissionGroupForm) => unknown;
  selectedPermissionGroup: PermissionGroupsDto;
};

const MIN_LENGTH_ERROR_TEXT = "האורך המינימלי הוא 3 תווים";
const NO_OWNER_ERROR_TEXT = "לא ניתן להשאיר את שדה הבעלים ריק";

export const EditPermissionGroupsPopup = ({
  openModal,
  setOpenModal,
  title,
  cancel,
  onSubmit,
  selectedPermissionGroup,
}: EditPermissionGroupsPopupProps) => {
  const { data: loggedUser } = useLoggedUserInfo();

  const { data } = useGetLoggedUserPermissionsOnGroup(selectedPermissionGroup._id);

  const { control, handleSubmit } = useForm<PermissionGroupForm>({
    resolver: zodResolver(PermissionGroupFormSchema),
    defaultValues: {
      name: selectedPermissionGroup.name,
      description: selectedPermissionGroup.description,
      ownerId: selectedPermissionGroup.ownerId,
      ownerName: selectedPermissionGroup.ownerName,
      coOwners: selectedPermissionGroup?.coOwners ?? [],
    },
  });

  const nameController = useController({
    control,
    name: "name",
    rules: { required: true, minLength: 3 },
  });

  const descriptionController = useController({
    control,
    name: "description",
  });

  const ownerIdController = useController({ control, name: "ownerId", rules: { required: true } });
  const ownerNameController = useController({ control, name: "ownerName", rules: { required: true } });
  const coOwnersController = useController({ control, name: "coOwners" });

  const UserNamesToFullName = ({ first_name, last_name, user_id }: GetUserInfoDto) =>
    first_name && last_name ? `${first_name} ${last_name}` : user_id;

  const splitName = (fullName: string) => {
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ");
    return { firstName, lastName };
  };

  const handleFormSubmit = (formData: PermissionGroupForm) => {
    onSubmit(formData);
    setOpenModal(false);
  };

  return (
    <GeneralPopup
      open={openModal}
      onClose={() => setOpenModal(false)}
      title={title}
      dialogContentProps={{
        sx: {
          maxHeight: "70vh",
          overflowY: "auto",
        },
      }}
      titleIcon={
        <Key
          color="#fff"
          fontSize={25}
          style={{
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
            backgroundColor: "#FC5367",
          }}
        />
      }
    >
      <form dir="rtl" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <Box
          sx={{
            padding: 2,
            margin: 1,
          }}
        >
          <FormControl sx={{ mb: 2, mt: 2, width: "100%" }}>
            <TextField
              disabled={!data?.can_update_details}
              label="שם קבוצת הרשאה"
              error={!!nameController.fieldState.error}
              helperText={nameController.fieldState.error?.message || MIN_LENGTH_ERROR_TEXT}
              {...nameController.field}
            />
          </FormControl>
          <FormControl sx={{ mb: 2, mt: 2, width: "100%" }}>
            <TextField label="תיאור" multiline rows={4} disabled={!data?.can_update_details} {...descriptionController.field} />
          </FormControl>
          <Box py={5} width="100%" height="80%" display="flex" flexDirection="column" rowGap={5}>
            <FormControl>
              <FormLabel> מנהל קבוצת ההרשאה</FormLabel>
              <UsersAutocomplete
                helperText={ownerNameController.fieldState.error ? NO_OWNER_ERROR_TEXT : null}
                error={!!ownerNameController.fieldState.error}
                disabled={!data?.can_change_owner}
                value={
                  ownerIdController.field.value
                    ? {
                        user_id: ownerIdController.field.value,
                        first_name: splitName(ownerNameController.field.value).firstName,
                        last_name: splitName(ownerNameController.field.value).lastName,
                      }
                    : null
                }
                onUserSelect={(user) => {
                  if (
                    ownerIdController.field.value === loggedUser?.userId &&
                    ownerIdController.field.value !== user?.user_id &&
                    !coOwnersController.field.value.some((coOwner) => coOwner.userId === ownerIdController.field.value)
                  ) {
                    coOwnersController.field.onChange(
                      coOwnersController.field.value.concat({
                        userId: ownerIdController.field.value,
                        userName: ownerNameController.field.value,
                      }),
                    );
                  }
                  if (coOwnersController.field.value.some((coOwner) => coOwner.userId === user?.user_id)) {
                    coOwnersController.field.onChange(coOwnersController.field.value.filter((coOwner) => coOwner.userId !== user?.user_id));
                  }
                  ownerIdController.field.onChange(user?.user_id ?? null);
                  ownerNameController.field.onChange(user ? UserNamesToFullName(user) : null);
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>שותפים לבעלות</FormLabel>
              <div style={{ border: "1px solid #EAECF0", padding: "10px" }}>
                <MultiUserSelector
                  disabledAddUser={!data?.can_add_co_owner}
                  disabledRemoveUser={!data?.can_delete_co_owner}
                  disabledUsers={!data?.can_delete_co_owner ? selectedPermissionGroup?.coOwners?.map((co) => co.userId) : []}
                  onChange={(users) => {
                    coOwnersController.field.onChange(
                      users.map((user): PermissionGroupForm["coOwners"][number] => ({
                        userId: user.user_id,
                        userName: UserNamesToFullName(user),
                      })),
                    );
                  }}
                  selectedUsers={uniqBy(
                    !data?.can_delete_co_owner
                      ? [...(selectedPermissionGroup?.coOwners || []), ...(coOwnersController.field.value || [])]
                      : coOwnersController.field.value,
                    "userId",
                  ).map(({ userId, userName }) => ({
                    user_id: userId,
                    first_name: splitName(userName).firstName,
                    last_name: splitName(userName).lastName,
                  }))}
                />
                {!!coOwnersController.fieldState.error && (
                  <FormHelperText error>{coOwnersController.fieldState.error.message}</FormHelperText>
                )}
              </div>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={cancel} variant="outlined" sx={{ margin: 0.5 }}>
            ביטול
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ margin: 0.5 }}
            disabled={
              (!data?.can_update_details && !data?.can_change_owner && !data?.can_delete_co_owner && !data?.can_add_co_owner) ||
              (coOwnersController.field.value.length > 0 && coOwnersController.field.value.some((coOwner) => coOwner?.userId === "")) ||
              !ownerIdController.field.value
            }
          >
            שמירה
          </Button>
        </Box>
      </form>
    </GeneralPopup>
  );
};
