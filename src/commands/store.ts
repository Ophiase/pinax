// The registries behind the commands. Every action reloads both files, so
// a change made meanwhile, by hand or by `just`, is kept.
import { realpath } from "node:fs/promises";
import { join } from "node:path";
import type { App } from "obsidian";
import {
  linkInto,
  list,
  MANIFEST,
  pinaxIn,
  probeAll,
  readText,
  writeRegister,
} from "../external/index.ts";
import { exists, openOutside } from "../links/index.ts";
import {
  type Candidate,
  candidatesOf,
  doorOf,
  isEntryName,
  nameOf,
  type Row,
  rowsOf,
  writeConfirmed,
  writeVault,
} from "../registry/index.ts";
import { type Loaded, load, parsed, VAULT_FILE } from "./load.ts";

export interface Place {
  readonly name: string;
  readonly dir: string;
  readonly door: string;
}

async function manifestIn(dir: string): Promise<unknown> {
  const content = await readText(join(dir, MANIFEST));
  return parsed(content, MANIFEST);
}

export class Pinakes {
  constructor(
    private readonly app: App,
    private readonly vault: string,
  ) {}

  async rows(): Promise<Row[]> {
    const { file, external, confirmed } = await this.load();
    const names = file.pinakes.map(({ name }) => name);
    const probes = await probeAll(external, names);
    return rowsOf(file.pinakes, confirmed, probes);
  }

  async candidates(): Promise<Candidate[]> {
    const { file, external } = await this.load();
    const entries = await list(external);
    const probes = await probeAll(external, entries.filter(isEntryName));
    return candidatesOf(probes, file.pinakes);
  }

  /** Opens a pinax's door; picking an unconfirmed one confirms it. */
  async open(row: Row): Promise<void> {
    if (row.state === "unconfirmed") {
      await this.confirm(row.name);
    }
    const { dir, door } = await this.locate(row.name);
    const path = join(dir, door);
    if (!(await exists(path))) {
      throw new Error(`nothing at ${path}`);
    }
    await openOutside(path);
  }

  /** A pinax's folder in external/, and its door inside it. */
  async locate(name: string): Promise<Place> {
    const { external } = await this.load();
    const dir = join(external, name);
    const door = doorOf(await manifestIn(dir));
    return { name, dir, door };
  }

  /** The vault's real folder, the one external/ is found from. */
  vaultRoot(): Promise<string> {
    return realpath(this.vault);
  }

  /** Tracks an entry of external/ in the vault, and confirms it here. */
  async register(name: string): Promise<void> {
    const { file } = await this.confirm(name);
    const tracked = file.pinakes.some((pinax) => pinax.name === name);
    if (tracked) {
      return;
    }
    const pinakes = [...file.pinakes, { name }];
    await this.app.vault.adapter.write(VAULT_FILE, writeVault({ ...file, pinakes }));
  }

  /** Links a folder from disk into external/, then registers it. */
  async registerFolder(picked: string): Promise<string> {
    if (!(await exists(picked))) {
      throw new Error(`no folder at ${picked}`);
    }
    const dir = (await pinaxIn(picked)) ?? picked;
    const name = nameOf(await manifestIn(dir), picked);
    const { external } = await this.load();
    await linkInto(external, name, dir);
    await this.register(name);
    return name;
  }

  private load(): Promise<Loaded> {
    return load(this.app, this.vault);
  }

  private async confirm(name: string): Promise<Loaded> {
    const loaded = await this.load();
    const names = [...loaded.confirmed, name];
    await writeRegister(loaded.external, writeConfirmed(names));
    return loaded;
  }
}
