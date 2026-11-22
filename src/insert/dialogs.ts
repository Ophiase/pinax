import {
  type App,
  type ButtonComponent,
  FuzzySuggestModal,
  Modal,
  Setting,
  type TextComponent,
} from "obsidian";
import type { Choose } from "../commands/index.ts";
import { attempt } from "../notice.ts";
import type { Node } from "./markdown.ts";

/** One way to link a pinax: its door, its tree, one of its notes. */
export interface Mode {
  readonly label: string;
  readonly run: () => unknown;
}

export class ModePicker extends FuzzySuggestModal<Mode> {
  constructor(
    app: App,
    private readonly modes: readonly Mode[],
  ) {
    super(app);
    this.setPlaceholder("Insert…");
  }

  getItems(): Mode[] {
    return [...this.modes];
  }

  getItemText(mode: Mode): string {
    return mode.label;
  }

  onChooseItem(mode: Mode): void {
    void attempt(mode.run);
  }
}

export class NotePicker extends FuzzySuggestModal<Node> {
  constructor(
    app: App,
    private readonly notes: readonly Node[],
    private readonly choose: Choose<Node>,
  ) {
    super(app);
    this.setPlaceholder("Link a note of the pinax");
  }

  getItems(): Node[] {
    return [...this.notes];
  }

  getItemText(note: Node): string {
    return note.path;
  }

  onChooseItem(note: Node): void {
    this.choose(note);
  }
}

/** How deep the tree goes: 1 is the top level only, 0 every level. */
export class DepthPrompt extends Modal {
  private depth: TextComponent | null = null;

  constructor(
    app: App,
    private readonly choose: Choose<number>,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle("Tree depth");
    new Setting(this.contentEl)
      .setName("Levels")
      .setDesc("0 is every level")
      .addText((field) => this.depthField(field));
    this.scope.register([], "Enter", () => this.submit());
    new Setting(this.contentEl).addButton((button) => this.insertButton(button));
  }

  private insertButton(button: ButtonComponent): void {
    button
      .setButtonText("Insert")
      .setCta()
      .onClick(() => this.submit());
  }

  private depthField(field: TextComponent): void {
    this.depth = field.setValue("0");
    field.inputEl.type = "number";
    field.inputEl.min = "0";
  }

  private submit(): boolean {
    const typed = Number.parseInt(this.depth?.getValue() ?? "0", 10);
    const levels = Number.isNaN(typed) || typed < 0 ? 0 : typed;
    this.close();
    this.choose(levels);
    return false;
  }
}
