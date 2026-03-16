export interface Requests {
  _id: string;
  user_id: string;
  temp: boolean;
  approver: string;
  approve_date: Date;
  attributes: Attributes[];
}

interface Attributes {
  content_world: string;
  classification: string;
  filter_value: object;
}
