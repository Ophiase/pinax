import { realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { DEFAULT_EXTERNAL } from "../registry/index.ts";

export const REGISTER = ".pinakes.yaml";
export const MANIFEST = "pinax.yaml";

/** external/, from the vault's real path and the vault file's `external:`. */
export async function externalOf(vault: string, setting?: string): Promise<string> {
  const root = await realpath(vault);
  return resolve(root, setting ?? DEFAULT_EXTERNAL);
}
