// A folder on disk, typed or browsed, linked into external/ and registered.
import { homedir } from "node:os";
import { remote } from "electron";
import { type App, type ButtonComponent, Modal, Setting, type TextComponent } from "obsidian";
import { attempt, say } from "../notice.ts";
import type { Pinakes } from "./store.ts";

const HELP = "A pinax folder, or a project holding pinax/: it is linked into external/.";

function expanded(path: string): string {
  const trimmed = path.trim();
  return trimmed.replace(/^~(?=$|\/)/, homedir());
}

async function pickFolder(): Promise<string | null> {
  const picked = await remote?.dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (!picked || picked.canceled) {
    return null;
  }
  return picked.filePaths[0] ?? null;
}

export class FolderPrompt extends Modal {
  private folder: TextComponent | null = null;

  constructor(
    app: App,
    private readonly store: Pinakes,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle("Register a pinax from disk");
    this.contentEl.createEl("p", { text: HELP });
    new Setting(this.contentEl).setName("Folder").addText((field) => this.folderField(field));
    const buttons = new Setting(this.contentEl);
    if (remote) {
      buttons.addButton((button) => this.browseButton(button));
    }
    buttons.addButton((button) => this.registerButton(button));
  }

  private folderField(field: TextComponent): void {
    this.folder = field.setPlaceholder("~/projects/my-project");
  }

  private browseButton(button: ButtonComponent): void {
    button.setButtonText("Browse…").onClick(() => this.browse());
  }

  private registerButton(button: ButtonComponent): void {
    button
      .setButtonText("Register")
      .setCta()
      .onClick(() => this.submit());
  }

  private async browse(): Promise<void> {
    const picked = await pickFolder();
    if (picked !== null) {
      this.folder?.setValue(picked);
    }
  }

  private async submit(): Promise<void> {
    const path = expanded(this.folder?.getValue() ?? "");
    await attempt(() => this.registered(path));
  }

  private async registered(path: string): Promise<void> {
    const name = await this.store.registerFolder(path);
    say(`${name} linked into external/ and registered`);
    this.close();
  }
}
