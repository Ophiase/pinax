import { type App, type FuzzyMatch, FuzzySuggestModal } from "obsidian";
import type { Row, State } from "../registry/index.ts";

export type Choose<Item> = (item: Item) => void;

const LABELS: Readonly<Record<State, string>> = {
  ready: "✅ ready",
  absent: "💤 absent here",
  broken: "💔 broken link",
  unconfirmed: "❔ not confirmed in external/",
};

export function isReachable({ state }: Row): boolean {
  return state === "ready" || state === "unconfirmed";
}

export function unreachable({ name, state, source }: Row): string {
  const why = `${name}: ${LABELS[state]}`;
  return source ? `${why}, source: ${source}` : why;
}

/** The tracked pinakes with their state here; picking one hands it on. */
export class PinaxPicker extends FuzzySuggestModal<Row> {
  constructor(
    app: App,
    private readonly rows: readonly Row[],
    private readonly choose: Choose<Row>,
  ) {
    super(app);
    this.setPlaceholder("Pick a pinax");
  }

  getItems(): Row[] {
    return [...this.rows];
  }

  getItemText(row: Row): string {
    return row.name;
  }

  override renderSuggestion(match: FuzzyMatch<Row>, element: HTMLElement): void {
    super.renderSuggestion(match, element);
    element.createDiv({ text: LABELS[match.item.state], cls: "suggestion-note" });
  }

  onChooseItem(row: Row): void {
    this.choose(row);
  }
}
