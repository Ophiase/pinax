// node --test: the registries read from any parsed shape, written stable.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  confirmedOf,
  doorOf,
  nameOf,
  trackedOf,
  vaultFileOf,
  writeConfirmed,
  writeVault,
} from "../src/registry/index.ts";

test("a tracked pinax is a name, or a name with its source", () => {
  const data = { pinakes: ["b", { name: "a", source: "forge a" }] };
  assert.deepEqual(trackedOf(data), [{ name: "a", source: "forge a" }, { name: "b" }]);
});

test("a missing, empty or odd file tracks nothing", () => {
  assert.deepEqual(trackedOf(null), []);
  assert.deepEqual(trackedOf("pinakes"), []);
  assert.deepEqual(trackedOf({ pinakes: "a" }), []);
  assert.deepEqual(confirmedOf({}), []);
});

test("a name that would leave external/ or hide in it is dropped", () => {
  const data = { pinakes: ["../x", "a/b", ".git", "", { source: "s" }, "ok"] };
  assert.deepEqual(confirmedOf(data), ["ok"]);
  assert.deepEqual(trackedOf(data), [{ name: "ok" }]);
});

test("duplicates count once, the first one wins", () => {
  const data = {
    pinakes: [
      { name: "a", source: "1" },
      { name: "a", source: "2" },
    ],
  };
  assert.deepEqual(trackedOf(data), [{ name: "a", source: "1" }]);
  assert.deepEqual(confirmedOf({ pinakes: ["b", "a", "b"] }), ["a", "b"]);
});

test("the door is the manifest's, kept inside the pinax", () => {
  assert.equal(doorOf({ door: "index.md" }), "index.md");
  assert.equal(doorOf({ door: "../x.md" }), "README.md");
  assert.equal(doorOf({ door: "/x.md" }), "README.md");
  assert.equal(doorOf(null), "README.md");
});

test("the register is one plain line per name", () => {
  const text = writeConfirmed(["b", "a"]);
  assert.equal(text.split("\n").slice(1).join("\n"), "pinakes:\n  - a\n  - b\n");
  assert.equal(writeConfirmed([]).split("\n")[1], "pinakes: []");
});

test("a value YAML would misread is quoted", () => {
  const pinakes = [{ name: "true" }, { name: "2024", source: "forge: x" }];
  const text = writeVault({ pinakes });
  assert.match(text, /- name: "2024"\n {4}source: "forge: x"\n/);
  assert.match(text, /- name: "true"\n/);
});

test("external/ is written only when it is not the default", () => {
  assert.doesNotMatch(writeVault({ external: "../external", pinakes: [] }), /external:/);
  assert.match(
    writeVault({ external: "../../ext", pinakes: [] }),
    /\nexternal: "\.\.\/\.\.\/ext"\n/,
  );
  assert.deepEqual(vaultFileOf({ external: "../x" }), { external: "../x", pinakes: [] });
  assert.deepEqual(vaultFileOf({}), { pinakes: [] });
});

test("a picked folder is named by its manifest, else by itself", () => {
  assert.equal(nameOf({ name: "brain" }, "/disk/project/pinax"), "brain");
  assert.equal(nameOf({ name: "../x" }, "/disk/project"), "project");
  assert.equal(nameOf(null, "/disk/project"), "project");
});
