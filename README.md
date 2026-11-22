# Pinax

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Kanon](https://img.shields.io/badge/%3C%3E-Kanon-blueviolet.svg)](.agents/kanon.md)
[![Pinax](https://img.shields.io/badge/%E2%97%89-Pinax-16a34a.svg)](pinax/README.md)
[![Obsidian](https://img.shields.io/badge/Obsidian-plugin-483699.svg?logo=obsidian&logoColor=white)](manifest.json)

A small standard for a project's knowledge folder that reads fine on any
forge and plugs into an Obsidian-style vault without being vault content.

The standard is its own first pinax: read
[pinax/README.md](./pinax/README.md).

## The plugin

Obsidian refuses a relative link that leaves the vault. The Pinax plugin
opens it instead:

```markdown
[my-project](../external/my-project/README.md)
```

- resolved from the note's folder, as on GitHub and in VS Code
- a `.md` opens in Obsidian (1.14+); any other file in the system's app
- a missing target: a notice, nothing created
- every other link: Obsidian's own behaviour
- desktop only; no settings, no network, nothing indexed

Two commands keep track of the pinakes a vault knows, through an
optional `pinakes.yaml` at its root:
[Registry](./pinax/pinax-registry.md).

- **Open pinax**: the tracked pinakes, their state here, their door
- **Register pinax**: from `external/`, or a folder on disk linked
  into it
- **Insert from pinax**: a link to its door, its notes as a tree, or one
  note found by fuzzy search, at the cursor

The other ways to open an external note, and why this one is recommended:
[Opening from Obsidian](./pinax/pinax-external.md#opening-from-obsidian).

## Pinax

This project's notes plug into an Obsidian vault:
[pinax/](pinax/README.md).

```sh
export OBSIDIAN_VAULT=<vault>
just pinax install
```

## Install

From the sources, into the vault `OBSIDIAN_VAULT` names:

```sh
cp .envrc.example .envrc    # set OBSIDIAN_VAULT, then direnv allow
just setup
just install-plugin
```

## License

[Apache 2.0](LICENSE)
