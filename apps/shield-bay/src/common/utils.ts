import mongoose from "mongoose";
import { z } from "zod";

export const exhaustiveMatchingGuard = (_: never): never => {
  throw new Error("Should not have reached here");
};

export const objectIdSchema = z.preprocess((value) => String(value), z.string()).refine((val) => mongoose.Types.ObjectId.isValid(val));
