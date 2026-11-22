// Reading external/: an entry probed by name, the folder listed one level only
// when the person asks, never watched.
import { lstat, readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Probe, Probes } from "../registry/index.ts";
import { MANIFEST } from "./paths.ts";

export async function succeeds(task: Promise<unknown>): Promise<boolean> {
  try {
    await task;
    return true;
  } catch {
    return false;
  }
}

export async function probe(external: string, name: string): Promise<Probe> {
  const path = join(external, name);
  if (!(await succeeds(lstat(path)))) {
    return "none";
  }
  if (!(await succeeds(stat(path)))) {
    return "dangling";
  }
  const manifest = await succeeds(stat(join(path, MANIFEST)));
  return manifest ? "pinax" : "other";
}

export async function probeAll(external: string, names: readonly string[]): Promise<Probes> {
  const probes = await Promise.all(names.map((name) => probe(external, name)));
  const entries = names.map((name, index) => [name, probes[index] ?? "none"] as const);
  return new Map(entries);
}

export async function list(external: string): Promise<string[]> {
  try {
    return await readdir(external);
  } catch {
    return [];
  }
}

/** A file's text; `null` when it is not there. */
export async function readText(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

/** The pinax in a picked folder: the folder itself, or its `pinax/`. */
export async function pinaxIn(folder: string): Promise<string | null> {
  for (const dir of [folder, join(folder, "pinax")]) {
    if (await succeeds(stat(join(dir, MANIFEST)))) {
      return dir;
    }
  }
  return null;
}
