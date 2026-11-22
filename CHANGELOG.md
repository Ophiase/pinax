# Changelog

Each release of the Pinax plugin, newest first. `just release` refuses a
version without its section here, and the GitHub release takes its notes
from it.

## Unreleased

- *Insert from pinax*, from the command palette or the editor's menu:
  a link to a pinax's door, its notes as a nested list of links (levels
  asked, 0 for all), or one of its notes found by fuzzy search.
- *Open pinax*: the pinakes the vault tracks in `pinakes.yaml`,
  each with its state on this machine; picking one opens its door.
- *Register pinax*: from an entry of `external/`, or from a folder on
  disk, linked into `external/`; the vault file and the machine's
  `external/.pinakes.yaml` both record it.
- `just pinax install` also confirms the pinax in
  `external/.pinakes.yaml` and tracks it in the vault's `pinakes.yaml`;
  `uninstall` removes the confirmation only. Both follow an `external:` set
  in the vault's `pinakes.yaml`.

## 0.1.0

- A relative markdown link that leaves the vault opens on click, from
  Reading view, Live Preview, or Ctrl/Cmd-click in Source mode.
- A `.md` target opens in Obsidian; any other file in the system's app.
- A missing target shows a notice naming the link; nothing is created.
- Every other link keeps Obsidian's behaviour; nothing is indexed or written.
