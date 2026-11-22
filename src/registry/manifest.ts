// A pinax's own pinax.yaml: the door it opens on, the name it goes by.
import { basename } from "node:path";
import { isEntryName } from "./files.ts";
import { field, text } from "./yaml.ts";

export const DEFAULT_DOOR = "README.md";

function isInside(path: string): boolean {
  const climbs = path.split(/[/\\]/).includes("..");
  return path !== "" && !path.startsWith("/") && !climbs;
}

export function doorOf(manifest: unknown): string {
  const door = text(field(manifest, "door")) ?? "";
  return isInside(door) ? door : DEFAULT_DOOR;
}

/** A picked folder's entry name: its manifest's `name`, else the folder's. */
export function nameOf(manifest: unknown, folder: string): string {
  const name = text(field(manifest, "name"));
  return name !== null && isEntryName(name) ? name : basename(folder);
}
