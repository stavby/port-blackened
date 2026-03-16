import { readFileSync } from "fs";
import { resolve, dirname } from "path";

type filePaths = "";

export const readServerFile = (filePath: filePaths) => {
  const packageDistPath = dirname(require.resolve("@port/server-files").toString());

  return readFileSync(resolve(packageDistPath, "../", filePath)).toString();
};
