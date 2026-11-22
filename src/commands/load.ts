// Both registries read fresh: the vault's through Obsidian, external/'s from
// disk. A file that is not valid YAML stops the command and is never rewritten.
import { join } from "node:path";
import { type App, parseYaml } from "obsidian";
import { externalOf, REGISTER, readText } from "../external/index.ts";
import { confirmedOf, type VaultFile, vaultFileOf } from "../registry/index.ts";

export const VAULT_FILE = "pinakes.yaml";

export interface Loaded {
  readonly file: VaultFile;
  readonly external: string;
  readonly confirmed: readonly string[];
}

export function parsed(content: string | null, name: string): unknown {
  if (content === null) {
    return null;
  }
  try {
    return parseYaml(content);
  } catch {
    throw new Error(`${name} is not valid YAML: fix it by hand`);
  }
}

async function vaultText(app: App): Promise<string | null> {
  const adapter = app.vault.adapter;
  const present = await adapter.exists(VAULT_FILE);
  return present ? adapter.read(VAULT_FILE) : null;
}

export async function load(app: App, vault: string): Promise<Loaded> {
  const content = await vaultText(app);
  const file = vaultFileOf(parsed(content, VAULT_FILE));
  const external = await externalOf(vault, file.external);
  const register = await readText(join(external, REGISTER));
  const confirmed = confirmedOf(parsed(register, REGISTER));
  return { file, external, confirmed };
}
