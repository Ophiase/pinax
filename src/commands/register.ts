import { type App, type FuzzyMatch, FuzzySuggestModal } from "obsidian";
import { attempt, say } from "../notice.ts";
import type { Candidate } from "../registry/index.ts";
import { FolderPrompt } from "./folder.ts";
import type { Pinakes } from "./store.ts";

interface Source {
  readonly label: string;
  readonly run: () => unknown;
}

function noteOf({ manifest }: Candidate): string {
  return manifest ? "◉ pinax.yaml" : "no pinax.yaml: foreign?";
}

class CandidatePicker extends FuzzySuggestModal<Candidate> {
  constructor(
    app: App,
    private readonly store: Pinakes,
    private readonly candidates: readonly Candidate[],
  ) {
    super(app);
    this.setPlaceholder("Register an entry of external/");
  }

  getItems(): Candidate[] {
    return [...this.candidates];
  }

  getItemText(candidate: Candidate): string {
    return candidate.name;
  }

  override renderSuggestion(match: FuzzyMatch<Candidate>, element: HTMLElement): void {
    super.renderSuggestion(match, element);
    element.createDiv({ text: noteOf(match.item), cls: "suggestion-note" });
  }

  onChooseItem({ name }: Candidate): void {
    void attempt(() => this.registered(name));
  }

  private async registered(name: string): Promise<void> {
    await this.store.register(name);
    say(`${name} registered`);
  }
}

class SourcePicker extends FuzzySuggestModal<Source> {
  constructor(
    app: App,
    private readonly sources: readonly Source[],
  ) {
    super(app);
    this.setPlaceholder("Register a pinax from…");
  }

  getItems(): Source[] {
    return [...this.sources];
  }

  getItemText(source: Source): string {
    return source.label;
  }

  onChooseItem(source: Source): void {
    void attempt(source.run);
  }
}

async function fromExternal(app: App, store: Pinakes): Promise<void> {
  const candidates = await store.candidates();
  if (candidates.length === 0) {
    throw new Error("nothing new in external/");
  }
  new CandidatePicker(app, store, candidates).open();
}

function fromDisk(app: App, store: Pinakes): void {
  new FolderPrompt(app, store).open();
}

export function registerPinax(app: App, store: Pinakes): void {
  const sources: readonly Source[] = [
    { label: "external/: an entry already there", run: () => fromExternal(app, store) },
    { label: "disk: a folder, linked into external/", run: () => fromDisk(app, store) },
  ];
  new SourcePicker(app, sources).open();
}
