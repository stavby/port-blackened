import { IsBoolean, IsIn } from "class-validator";

export const VERIFICATION_STAGE_NAMES = ["technical_correctness", "business_correctness", "documentation_correctness"] as const;

export type VerificationStageName = (typeof VERIFICATION_STAGE_NAMES)[number];

export class VerificationStage {
  @IsIn(VERIFICATION_STAGE_NAMES)
  stage: VerificationStageName;

  @IsBoolean()
  is_checked: boolean;
}

export const VERIFICATION_CHECK_STAGES: { stage: VerificationStageName; title: string; verificationText: string }[] = [
  {
    stage: "technical_correctness",
    title: "בדיקת נכונות טכנית",
    verificationText:
      "אני מאשר/ת כי הטבלה נבנתה על ידי גורם טכני מוסמך, הנתונים נשאבים ממקורות מידע מהימנים, עברו תהליך הנדסי תקין והם נקיים מנתוני סרק או שגיאות טכניות.",
  },
  {
    stage: "business_correctness",
    title: "בדיקת נכונות עסקית",
    verificationText:
      "אני מאשר/ת כי הטבלה עונה על הצורך העסקי שהוגדר, הלוגיקה המוטמעת בה נכונה ומשקפת את המציאות, והיא מהווה בסיס אמין לקבלת החלטות.",
  },
  {
    stage: "documentation_correctness",
    title: "בדיקת דוקומנטציה",
    verificationText:
      "אני מאשר/ת כי לטבלה קיים תיעוד מקיף וברור, הכולל את מטרתה, הסבר על השדות המרכזיים שבה ומאפשר שימוש יעיל ועצמאי למשתמשי הקצה.",
  },
];

export const isDataVerified = (verificationStages?: { stage: VerificationStageName; is_checked: boolean }[]) =>
  verificationStages?.length &&
  verificationStages.every(({ is_checked }) => is_checked) &&
  VERIFICATION_STAGE_NAMES.every((requiredStage) => verificationStages.some(({ stage }) => requiredStage === stage));
