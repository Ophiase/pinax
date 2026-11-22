---
up: "[Pinax](./README.md)"
prev: "[Folder](./pinax-folder.md)"
---

# Registry

## Optional

- a convenience: knowing, from Obsidian, which pinakes a vault has
- never required: a pinax works with no registry and no plugin
  - link it into `external/`, or keep it anywhere on disk
  - reference it with a plain relative link, as before
- nothing breaks when the files are missing: there is just nothing to show

```mermaid
flowchart LR
    subgraph vault["🟣 my-vault: synced"]
        want["pinakes.yaml"]
    end
    subgraph router["external/: per machine"]
        here[".pinakes.yaml"]
        l1(["pinax"])
        l2[".git/, random/: ignored"]
    end
    subgraph disk["disk"]
        g1["pinax/"]
    end
    want -->|tracks| l1
    here -->|confirms| l1
    l1 -.->|symlink| g1
    classDef link fill:#fff,stroke:#888,stroke-dasharray: 5 5
    classDef noise fill:#f1f5f9,stroke:#94a3b8,color:#64748b
    class l1 link
    class l2 noise
    style vault fill:#f3e8ff,stroke:#9333ea,stroke-width:2px
    style router fill:#fff7ed,stroke:#ea580c,stroke-dasharray: 5 5
    style disk fill:#f8fafc,stroke:#475569,stroke-width:2px
```

## Two files

- `<vault>/pinakes.yaml`: the **source of truth**, synced with the vault
  - the pinakes this vault tracks
  - tracked is not present: a machine may lack any of them
  - at the root, not in the plugin's `data.json`: synced with the notes,
    read by `just`, kept when the plugin goes
  - `external:` moves `external/`, from the vault's root; links written
    `../external/…` do not follow it
- `external/.pinakes.yaml`: the **register of this machine**
  - which entries of `external/` are confirmed pinakes
  - **excludes by default**: `.git/`, a random folder, a stray link
  - excluded is not broken: a link to it still opens
  - hidden: a scan of `external/` skips it with every dot entry

```yaml
# <vault>/pinakes.yaml
external: ../external     # optional: the default
pinakes:
  - name: pinax        # its entry in external/
    source: <git url>     # optional: shown, never fetched
```

```yaml
# external/.pinakes.yaml
pinakes:
  - pinax
```

- the door is the pinax's own: `door` in its `pinax.yaml`, else
  `README.md`
- one entry per line, sorted: clean merges when the vault syncs
- the register is line-based on purpose: `pinax.just` edits it in bash,
  without `yq`
- a file that is not valid YAML stops the plugin, never gets rewritten

## States

| State | Vault | Register | `external/` |
| --- | --- | --- | --- |
| ✅ ready | yes | yes | an entry that resolves |
| 💤 absent here | yes | any | nothing |
| 💔 broken | yes | yes | a dangling link |
| ❔ unconfirmed | yes | no | an entry |
| ➕ candidate | no | any | a visible entry that resolves |

- `external/` is shared by every vault in the same folder: the register
  belongs to the machine, not to one vault
- a **candidate** is any entry not starting with `.`
  - with `pinax.yaml`: likely a pinax, listed first
  - without: likely foreign, the person decides

## Plugin

- a ribbon icon opens a menu of *Open* and *Register*
- **Open pinax**, a command
  - the tracked pinakes and their state; picking one opens its door
  - probes each tracked name in `external/`: nothing is listed
  - picking an unconfirmed one confirms it
- **Register pinax**, a command
  - *external/*: lists it, one level, then tracks and confirms the pick
  - *disk*: a folder, typed or browsed; the folder or its `pinax/`
    is linked into `external/`, then tracked and confirmed
  - the name: `name` in its `pinax.yaml`, else the folder's
  - an entry already there under that name is kept, never replaced
- **Insert from pinax**, a command and the editor's context menu
  - pick a pinax, then how to link it, at the cursor:
  - *Door*: `[name](…/README.md)`
  - *Tree*: its `.md` notes as a nested list of links, levels asked, 0 for
    all; a folder without a note is left out
  - *Find*: a fuzzy search over its notes, one link
  - links are relative to the note's folder, as the plugin opens them

## Just

- `just pinax install` links the pinax, confirms it, and tracks it
  in the vault's `pinakes.yaml` when the line is not there yet
- `just pinax uninstall` removes the link and the confirmation; the
  vault keeps tracking it, for the other machines
- `just pinax` shows whether it is confirmed, and writes nothing
