// The markdown written into a note: a link, or a pinax's notes as a list
// of links, all relative to the note's folder.
import { basename, extname, sep } from "node:path";

/** A file or a folder of a pinax, its path relative to the pinax. */
export interface Node {
  readonly name: string;
  readonly path: string;
  readonly children?: readonly Node[];
}

const INDENT = "  ";

function segmentOf(segment: string): string {
  const encoded = encodeURIComponent(segment);
  return encoded.replace(/\(/g, "%28").replace(/\)/g, "%29");
}

/** `base`, from the note's folder to the pinax, then `path` inside it. */
export function hrefOf(base: string, path: string): string {
  const segments = [...base.split(sep), ...path.split(sep)];
  const kept = segments.filter((segment) => segment !== "" && segment !== ".");
  return kept.map(segmentOf).join("/");
}

/** A note by its name, any other file by its full name. */
export function titleOf(path: string): string {
  const name = basename(path);
  const title = extname(name) === ".md" ? name.slice(0, -3) : name;
  return title.replace(/[[\]]/g, "\\$&");
}

export function linkOf(base: string, path: string, title = titleOf(path)): string {
  return `[${title}](${hrefOf(base, path)})`;
}

export function isNote({ path }: Node): boolean {
  return extname(path) === ".md";
}

function nodeLines(node: Node, base: string, depth: number): string[] {
  const indent = INDENT.repeat(depth);
  if (node.children === undefined) {
    return [`${indent}- ${linkOf(base, node.path)}`];
  }
  return [`${indent}- ${node.name}/`, ...linesOf(node.children, base, depth + 1)];
}

function linesOf(nodes: readonly Node[], base: string, depth: number): string[] {
  return nodes.flatMap((node) => nodeLines(node, base, depth));
}

export function treeOf(nodes: readonly Node[], base: string): string {
  const lines = linesOf(nodes, base, 0);
  return `${lines.join("\n")}\n`;
}

function isPresent(node: Node | null): node is Node {
  return node !== null;
}

function noteNode(node: Node): Node | null {
  if (node.children === undefined) {
    return isNote(node) ? node : null;
  }
  const children = notesOf(node.children);
  return children.length === 0 ? null : { ...node, children };
}

/** The notes of a tree, and only the folders that lead to one. */
export function notesOf(nodes: readonly Node[]): Node[] {
  return nodes.map(noteNode).filter(isPresent);
}

function cutNode(node: Node, depth: number): Node {
  if (node.children === undefined) {
    return node;
  }
  const children = depth > 1 ? cut(node.children, depth - 1) : [];
  return { ...node, children };
}

/** A tree kept `depth` levels deep; 0 keeps every level. */
export function cut(nodes: readonly Node[], depth: number): Node[] {
  if (depth <= 0) {
    return [...nodes];
  }
  return nodes.map((node) => cutNode(node, depth));
}

/** Every file of a tree, in the order of the tree. */
export function filesOf(nodes: readonly Node[]): Node[] {
  return nodes.flatMap((node) => (node.children === undefined ? [node] : filesOf(node.children)));
}
