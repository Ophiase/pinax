# AGENTS.md

Instructions for any coding agent in this repository. Claude Code reads them
through `.claude/CLAUDE.md`.

The canon is [.agents/kanon.md](.agents/kanon.md); the `<>` in the README is
its sign. The `◉` badge marks a pinax.

## Layout

| Path | What it holds |
| --- | --- |
| `pinax/` | the standard, its own first pinax |
| `pinax/pinax.just` | the module linking a pinax into `external/` |
| `src/main.ts` | the plugin: the link wrapper, the commands, the menus |
| `src/links/` | where a link out of the vault lands, and opening it |
| `src/registry/` | the two registries and the states; pure, tested |
| `src/external/` | probing, listing and writing `external/` |
| `src/commands/` | *Open pinax*, *Register pinax*, their dialogs |
| `src/insert/` | *Insert from pinax*: a door, a tree, or one note |
| `tests/` | `node --test`: the pure modules, and `external/` on a temp disk |
| `types/` | declarations for what TypeScript cannot see: `electron` |
| `dist/main.js` | the bundle, built, never edited, gitignored |

## The harness

TypeScript follows
[.agents/portable/rules/javascript.md](.agents/portable/rules/javascript.md)
and [.agents/portable/rules/typescript.md](.agents/portable/rules/typescript.md);
comments follow
[.agents/portable/rules/comments.md](.agents/portable/rules/comments.md), and
folders [.agents/rules/layout.md](.agents/rules/layout.md). `biome.json`
extends the shared config and `tsconfig.json` is strict; neither is loosened
locally.

- `just check` runs rumdl, the diagrams, biome, `tsc`, `node --test`, then
  `just guards` over every changed file.
- `.agents/portable/` is copied as is from elsewhere: never edited here.

## Plugin

- `just build` bundles; `just install-plugin` copies it into
  `$OBSIDIAN_VAULT`, exported by `.envrc`; the `update-in-obsidian` skill
  finds the vault when `.envrc` does not name it.
- Probe `external/` by name; list it, one level, only when asked; never
  index or watch it. A pinax's own folder is read only to insert from it.
- Write only the two registries, a link into `external/`, and text at the
  cursor, on the person's action; never rewrite a link in a note.
- Never a runtime dependency or a network call.
- No vault, machine or project name, and no home path, in a tracked file.

## Work

- English everywhere: markdown, comments, commits.
- Small steps: one change, then `just check`.
- Never commit or push without being asked.

## Markdown

- `rumdl check .` passes; lines stay under 80 columns.
- Lists, one idea per line; no prose walls.
- Notes in `pinax/` follow the standard they describe: relative markdown
  links only, no wikilinks, no links out of the folder.

## Diagrams

- Mermaid only, rendered by `just diagrams`: at most 875 px wide.
- Open the PNG in `.agents/build/diagrams/` before calling it done.
- No `~~~`, no `direction` inside nested subgraphs, node-to-node edges only.
- No legend: a diagram reads on its own.
