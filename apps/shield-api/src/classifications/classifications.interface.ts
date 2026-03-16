import { ObjectId } from "mongodb";

export interface ClassificationOutput {
  _id: ObjectId;
  name: string;
  description: string;
  related_domains: {
    _id: string;
    display_name: string;
  }[];
}

export interface InsertClassificationInput {
  name: string;
  description: string;
  related_domains: string[];
}
