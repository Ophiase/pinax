mod pinax "pinax/pinax.just"

vault := env("OBSIDIAN_VAULT", "")

default:
    @just --list --list-submodules

[group("dev")]
[doc("Install the toolchain")]
setup:
    npm ci || npm install

[group("dev")]
[doc("Format and lint, fixing what can be fixed")]
fmt:
    npx biome check --write .

[group("check")]
[doc("Check the markdown of the repository")]
rumdl:
    rumdl check .

[group("check")]
[doc("Render every Mermaid block and fail past 875 px wide")]
diagrams:
    .agents/checks/diagrams.sh pinax/*.md

[group("check")]
[doc("Lint, type-check and test the plugin")]
code:
    npx biome check .
    npx tsc -p .
    node --test tests/*.test.ts

[group("check")]
[doc("Run the project's and the portable checks over every changed file")]
[script("bash")]
guards:
    status=0
    for check in markdown french comment-slop short-names hardcoded-url portable biome file-length folder-size yaml-extension; do
        just _guard "$check" || status=1
    done
    exit $status

_guard check:
    @.agents/portable/checks/changed-files.sh | xargs -r -d '\n' .agents/checks/run.sh {{ check }}

[group("check")]
[doc("Everything that must pass before declaring work done")]
check: rumdl diagrams code guards

[group("build")]
[doc("Bundle src/ into dist/main.js")]
build: code
    npx esbuild src/main.ts --bundle --format=cjs --platform=browser --target=es2022 \
      --external:obsidian --external:electron --external:node:* --outfile=dist/main.js

[group("build")]
[doc("Copy the build into $OBSIDIAN_VAULT/.obsidian/plugins/pinax")]
[script("bash")]
install-plugin: build
    set -euo pipefail
    [[ -n "{{ vault }}" ]] || { echo "export OBSIDIAN_VAULT=<vault>: see .envrc.example" >&2; exit 1; }
    [[ -d "{{ vault }}/.obsidian" ]] || { echo "OBSIDIAN_VAULT holds no .obsidian" >&2; exit 1; }
    target="{{ vault }}/.obsidian/plugins/pinax"
    mkdir -p "$target"
    cp dist/main.js manifest.json "$target/"
    echo "installed: reload Obsidian"

[group("release")]
[doc("The CHANGELOG.md section of a version, without its heading")]
notes version:
    @awk '/^## / { inside = ($2 == "{{ version }}"); next } inside' CHANGELOG.md

[group("release")]
[doc("Set the version in every manifest, commit and tag it; pushing the tag publishes a draft")]
[script("bash")]
release version:
    set -euo pipefail
    [[ "{{ version }}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "a version is x.y.z, without v" >&2; exit 1; }
    [[ -z "$(git status --porcelain)" ]] || { echo "commit or stash first" >&2; exit 1; }
    [[ -n "$(just notes {{ version }})" ]] || { echo "CHANGELOG.md has no section {{ version }}" >&2; exit 1; }
    npm version "{{ version }}" --no-git-tag-version --allow-same-version >/dev/null
    node -e '
      const fs = require("node:fs");
      const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
      const write = (file, data) => fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
      const manifest = read("manifest.json");
      const versions = read("versions.json");
      manifest.version = process.argv[1];
      versions[manifest.version] = manifest.minAppVersion;
      write("manifest.json", manifest);
      write("versions.json", versions);
    ' "{{ version }}"
    just check
    git add manifest.json versions.json package.json package-lock.json
    git diff --cached --quiet || git commit -q -m "release: {{ version }}"
    git tag -a "{{ version }}" -m "{{ version }}"
    echo "tagged {{ version }}: git push origin main {{ version }} publishes the draft release"

[group("dev")]
[doc("Wire the git pre-commit hook")]
install-hooks:
    git config core.hooksPath .githooks
