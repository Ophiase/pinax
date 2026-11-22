// node --test: the links written into a note, and the tree read from disk.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { after, test } from "node:test";
import { cut, filesOf, hrefOf, linkOf, notesOf, treeOf } from "../src/insert/markdown.ts";
import { walk } from "../src/insert/walk.ts";
import { outsideTarget } from "../src/links/resolve.ts";

const VAULT = "/disk/parent/vault";
const NOTE = "a/b/note.md";
const PINAX = "/disk/parent/external/g";
const BASE = relative(join(VAULT, "a/b"), PINAX);

const TREE = [
  { name: "README.md", path: "README.md" },
  {
    name: "topic",
    path: "topic",
    children: [{ name: "x (1).md", path: "topic/x (1).md" }],
  },
];

const pathOf = ({ path }: { readonly path: string }) => path;

test("an inserted link lands on its file, as the plugin reads it", () => {
  for (const path of ["README.md", "my notes/x (1).md", "c#.md"]) {
    const href = hrefOf(BASE, path);
    assert.equal(outsideTarget(VAULT, NOTE, href), join(PINAX, path));
  }
});

test("a link is titled by the note, or by the name given", () => {
  assert.equal(linkOf("../g", "topic/x.md"), "[x](../g/topic/x.md)");
  assert.equal(linkOf("../g", "README.md", "g"), "[g](../g/README.md)");
  assert.equal(linkOf("../g", "a [b].pdf"), "[a \\[b\\].pdf](../g/a%20%5Bb%5D.pdf)");
});

test("a tree is a nested list: folders as names, files as links", () => {
  const expected = "- [README](../g/README.md)\n- topic/\n  - [x (1)](../g/topic/x%20%281%29.md)\n";
  assert.equal(treeOf(TREE, "../g"), expected);
  assert.deepEqual(filesOf(TREE).map(pathOf), ["README.md", "topic/x (1).md"]);
});

const roots: string[] = [];
const remove = (root: string) => rm(root, { recursive: true });
after(() => Promise.all(roots.map(remove)));

async function pinax(): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "pinax-")));
  roots.push(root);
  await mkdir(join(root, "topic", "deep"), { recursive: true });
  await mkdir(join(root, "code"));
  await mkdir(join(root, ".git"));
  for (const file of ["README.md", "pinax.yaml", "code/run.py", "topic/deep/x.md"]) {
    await writeFile(join(root, file), "");
  }
  return root;
}

test("the tree holds notes only: no other file, no folder without a note", async () => {
  const notes = notesOf(await walk(await pinax()));
  const expected = "- [README](README.md)\n- topic/\n  - deep/\n    - [x](topic/deep/x.md)\n";
  assert.equal(treeOf(notes, "."), expected);
});

test("a cut tree keeps a folder that leads to notes, 0 keeps all", async () => {
  const notes = notesOf(await walk(await pinax()));
  assert.equal(treeOf(cut(notes, 1), "."), "- [README](README.md)\n- topic/\n");
  assert.equal(treeOf(cut(notes, 0), "."), treeOf(notes, "."));
});
