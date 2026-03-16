import technicalCorrectnessIcon from "./technical-correctness.svg";
import businessCorrectnessIcon from "./business-correctness.svg";
import documentationCorrectnessIcon from "./documentation-correctness.svg";
import { VerificationStageName } from "@port/shield-schemas";

export const VERIFICATION_STAGE_ICONS: Record<VerificationStageName, string> = {
  technical_correctness: technicalCorrectnessIcon,
  business_correctness: businessCorrectnessIcon,
  documentation_correctness: documentationCorrectnessIcon,
};
