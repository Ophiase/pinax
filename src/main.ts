// Pinax: open the relative links that leave the vault, index nothing; and,
// on demand, the pinakes the vault tracks. ◉
import {
  type App,
  type Editor,
  FileSystemAdapter,
  type MarkdownFileInfo,
  Menu,
  type MenuItem,
  Plugin,
} from "obsidian";
import { openPinax, Pinakes, registerPinax } from "./commands/index.ts";
import { insertFromPinax } from "./insert/index.ts";
import { wrapLinks } from "./links/index.ts";
import { attempt } from "./notice.ts";

interface Command {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly run: (app: App, store: Pinakes) => unknown;
}

interface InsertContext {
  readonly store: Pinakes;
  readonly view: MarkdownFileInfo;
}

const COMMANDS: readonly Command[] = [
  { id: "open-pinax", name: "Open pinax", icon: "library", run: openPinax },
  {
    id: "register-pinax",
    name: "Register pinax",
    icon: "folder-plus",
    run: registerPinax,
  },
];

export default class Pinax extends Plugin {
  override onload() {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) {
      return;
    }
    const vault = adapter.getBasePath();
    const store = new Pinakes(this.app, vault);
    wrapLinks(this, vault);
    this.registerCommands(store);
    this.registerInsert(store);
    this.addRibbonIcon("library", "Pinakes", (event) => this.showMenu(event, store));
  }

  private registerInsert(store: Pinakes) {
    this.addCommand({
      id: "insert-from-pinax",
      name: "Insert from pinax",
      icon: "link",
      editorCallback: (editor, view) => this.insert(store, editor, view),
    });
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) =>
        this.fillEditorMenu(menu, editor, { store, view }),
      ),
    );
  }

  private fillEditorMenu(menu: Menu, editor: Editor, context: InsertContext) {
    menu.addItem((item) => this.insertItem(item, editor, context));
  }

  private insertItem(item: MenuItem, editor: Editor, { store, view }: InsertContext) {
    item
      .setTitle("Insert from pinax")
      .setIcon("link")
      .onClick(() => this.insert(store, editor, view));
  }

  private insert(store: Pinakes, editor: Editor, view: MarkdownFileInfo) {
    const note = view.file?.path ?? "";
    return attempt(() => insertFromPinax({ app: this.app, store, editor, note }));
  }

  private run(command: Command, store: Pinakes) {
    return attempt(() => command.run(this.app, store));
  }

  private registerCommands(store: Pinakes) {
    for (const command of COMMANDS) {
      const { id, name, icon } = command;
      this.addCommand({ id, name, icon, callback: () => this.run(command, store) });
    }
  }

  private showMenu(event: MouseEvent, store: Pinakes) {
    const menu = new Menu();
    for (const command of COMMANDS) {
      menu.addItem((item) => this.menuItem(item, command, store));
    }
    menu.showAtMouseEvent(event);
  }

  private menuItem(item: MenuItem, command: Command, store: Pinakes) {
    item
      .setTitle(command.name)
      .setIcon(command.icon)
      .onClick(() => this.run(command, store));
  }
}
