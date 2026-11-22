// node --test: probing and linking against a real, throwaway external/.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readlink, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { externalOf, linkInto, pinaxIn, probe } from "../src/external/index.ts";

const roots: string[] = [];
const remove = (root: string) => rm(root, { recursive: true });
after(() => Promise.all(roots.map(remove)));

async function disk(): Promise<{ root: string; external: string; project: string }> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "pinax-")));
  roots.push(root);
  const external = join(root, "external");
  const project = join(root, "project");
  await mkdir(join(project, "pinax"), { recursive: true });
  await mkdir(join(root, "vault"));
  await writeFile(join(project, "pinax", "pinax.yaml"), "name: project\n");
  return { root, external, project };
}

test("external/ sits beside the vault unless the vault file says", async () => {
  const { root } = await disk();
  assert.equal(await externalOf(join(root, "vault")), join(root, "external"));
  assert.equal(await externalOf(join(root, "vault"), "../../x"), join(root, "..", "x"));
});

test("an entry is probed by name: pinax, other, dangling, none", async () => {
  const { external, project } = await disk();
  await mkdir(join(external, "plain"), { recursive: true });
  await symlink(join(project, "pinax"), join(external, "g"));
  await symlink(join(project, "gone"), join(external, "dead"));
  assert.equal(await probe(external, "g"), "pinax");
  assert.equal(await probe(external, "plain"), "other");
  assert.equal(await probe(external, "dead"), "dangling");
  assert.equal(await probe(external, "missing"), "none");
});

test("a picked project gives its pinax/ folder", async () => {
  const { project, root } = await disk();
  assert.equal(await pinaxIn(project), join(project, "pinax"));
  assert.equal(await pinaxIn(join(project, "pinax")), join(project, "pinax"));
  assert.equal(await pinaxIn(root), null);
});

test("linking creates external/, keeps the same link, refuses another", async () => {
  const { external, project, root } = await disk();
  await linkInto(external, "p", join(project, "pinax"));
  assert.equal(await readlink(join(external, "p")), join(project, "pinax"));
  await linkInto(external, "p", join(project, "pinax"));
  await assert.rejects(linkInto(external, "p", root), /already exists/);
});
