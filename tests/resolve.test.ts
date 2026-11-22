// node --test: where links land, from a note three folders deep.
import assert from "node:assert/strict";
import { test } from "node:test";
import { linkpathOf, outsideTarget } from "../src/links/resolve.ts";

const VAULT = "/disk/parent/vault";
const NOTE = "a/b/c/note.md";

test("a link out of the vault resolves from the note's folder", () => {
  const target = outsideTarget(VAULT, NOTE, "../../../../external/pinax/README.md");
  assert.equal(target, "/disk/parent/external/pinax/README.md");
});

test("a link inside the vault is left alone", () => {
  assert.equal(outsideTarget(VAULT, NOTE, "../../x.md"), null);
  assert.equal(outsideTarget(VAULT, NOTE, "./sibling.md"), null);
  assert.equal(outsideTarget(VAULT, NOTE, "potato"), null);
});

test("a vault whose name prefixes the target is not inside it", () => {
  const target = outsideTarget(VAULT, "note.md", "../vault-other/x.md");
  assert.equal(target, "/disk/parent/vault-other/x.md");
});

test("percent-encoding and spaces both work", () => {
  const encoded = outsideTarget(VAULT, NOTE, "../../../../external/my%20project/README.md");
  const spaced = outsideTarget(VAULT, NOTE, "../../../../external/my project/README.md");
  assert.equal(encoded, "/disk/parent/external/my project/README.md");
  assert.equal(spaced, encoded);
});

test("a heading or a block is not part of the path", () => {
  assert.equal(linkpathOf("../x.md#Rules"), "../x.md");
  assert.equal(linkpathOf("../x.md#^block"), "../x.md");
});

test("URLs, absolute paths and empty links are left alone", () => {
  assert.equal(outsideTarget(VAULT, NOTE, "https://example.org"), null); // hardcoded-url: the scheme under test
  assert.equal(outsideTarget(VAULT, NOTE, "file:///disk/x.md"), null); // hardcoded-url: the scheme under test
  assert.equal(outsideTarget(VAULT, NOTE, "/x.md"), null);
  assert.equal(outsideTarget(VAULT, NOTE, "#heading"), null);
});

test("a malformed escape is read as written", () => {
  assert.equal(linkpathOf("../100%.md"), "../100%.md");
});
