import { DomainWithClassificationsDto } from "./domains.dto";

export interface DomainsDictionary {
  [key: string]: Omit<DomainWithClassificationsDto, "permission_table_id">;
}

export interface DomainClassificationExposures {
  classificationExposures: Record<string, number>;
  domainExposure: number;
}
