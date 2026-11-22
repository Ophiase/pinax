// A pinax's own folder, read on the person's demand. A link found inside is
// not followed, so a loop cannot run forever.
import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Node } from "./markdown.ts";

function filesFirst(left: Node, right: Node): number {
  const leftFolder = left.children !== undefined;
  const rightFolder = right.children !== undefined;
  if (leftFolder === rightFolder) {
    return left.name.localeCompare(right.name);
  }
  return leftFolder ? 1 : -1;
}

async function nodeOf(root: string, folder: string, entry: Dirent): Promise<Node | null> {
  const path = join(folder, entry.name);
  if (entry.isFile()) {
    return { name: entry.name, path };
  }
  if (!entry.isDirectory()) {
    return null;
  }
  const children = await childrenOf(root, path);
  return { name: entry.name, path, children };
}

function isNode(node: Node | null): node is Node {
  return node !== null;
}

async function childrenOf(root: string, folder: string): Promise<Node[]> {
  const entries = await readdir(join(root, folder), { withFileTypes: true });
  const visible = entries.filter((entry) => !entry.name.startsWith("."));
  const nodes = await Promise.all(visible.map((entry) => nodeOf(root, folder, entry)));
  return nodes.filter(isNode).sort(filesFirst);
}

/** Every visible file and folder under `root`. */
export function walk(root: string): Promise<Node[]> {
  return childrenOf(root, "");
}
