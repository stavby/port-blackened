import StyledTooltipShield from "@components/Tooltip/StyledTooltip";
import { Avatar, Typography } from "@mui/material";
import { verifiedCheckmarkIcon } from "@port/components/icons";
import { isDataVerified } from "@port/shield-schemas";
import { Table } from "@types";

type VerifiedCheckmarkProps = {
  table?: Pick<Table, "verification_stages" | "last_verification_time">;
};

export const VerifiedCheckmark = ({ table }: VerifiedCheckmarkProps) =>
  table && isDataVerified(table.verification_stages) ? (
    <StyledTooltipShield
      arrow
      title={
        <>
          <Typography sx={{ direction: "ltr", mb: 2 }} fontSize={13}>
            <b>מידע מאומת</b>
          </Typography>
          {table.last_verification_time && (
            <Typography sx={{ direction: "ltr" }} fontSize={13}>
              <b>זמן אימות אחרון:</b> {new Date(table.last_verification_time).toLocaleString("he-IL")}
            </Typography>
          )}
        </>
      }
      placement="left"
    >
      <Avatar src={verifiedCheckmarkIcon} alt="checkmark_icon" sx={{ width: 20, height: 20, mr: "25px" }} />
    </StyledTooltipShield>
  ) : (
    <></>
  );
