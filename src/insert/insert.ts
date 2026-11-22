// Insert from pinax: a link to a pinax's door, its tree, or one of its
// notes, written at the cursor, relative to the note's folder.
import { dirname, join, relative } from "node:path";
import type { App, Editor } from "obsidian";
import { isReachable, type Pinakes, PinaxPicker, type Place } from "../commands/index.ts";
import { attempt } from "../notice.ts";
import type { Row } from "../registry/index.ts";
import { DepthPrompt, type Mode, ModePicker, NotePicker } from "./dialogs.ts";
import { cut, filesOf, linkOf, type Node, notesOf, treeOf } from "./markdown.ts";
import { walk } from "./walk.ts";

export interface Session {
  readonly app: App;
  readonly store: Pinakes;
  readonly editor: Editor;
  readonly note: string;
}

/** A pinax, and `base`: the way from the note's folder to it. */
interface Target extends Place {
  readonly base: string;
}

class Insertion {
  constructor(
    private readonly session: Session,
    private readonly target: Target,
  ) {}

  modes(): Mode[] {
    return [
      { label: `Door: ${this.target.door}`, run: () => this.door() },
      { label: "Tree: its notes, as a list of links", run: () => this.askDepth() },
      { label: "Find: one note of the pinax", run: () => this.find() },
    ];
  }

  private write(text: string): void {
    this.session.editor.replaceSelection(text);
  }

  private door(): void {
    const { base, door, name } = this.target;
    this.write(linkOf(base, door, name));
  }

  private askDepth(): void {
    const prompt = new DepthPrompt(this.session.app, (depth) => this.tree(depth));
    prompt.open();
  }

  private tree(depth: number): void {
    void attempt(() => this.writeTree(depth));
  }

  private async writeTree(depth: number): Promise<void> {
    const notes = await this.notes();
    this.write(treeOf(cut(notes, depth), this.target.base));
  }

  private async find(): Promise<void> {
    const notes = filesOf(await this.notes());
    new NotePicker(this.session.app, notes, (note) => this.link(note)).open();
  }

  private async notes(): Promise<Node[]> {
    const notes = notesOf(await walk(this.target.dir));
    if (notes.length === 0) {
      throw new Error(`no note in ${this.target.name}`);
    }
    return notes;
  }

  private link(note: Node): void {
    this.write(linkOf(this.target.base, note.path));
  }
}

async function targetOf(session: Session, row: Row): Promise<Target> {
  const place = await session.store.locate(row.name);
  const root = await session.store.vaultRoot();
  const folder = join(root, dirname(session.note));
  return { ...place, base: relative(folder, place.dir) };
}

async function start(session: Session, row: Row): Promise<void> {
  const target = await targetOf(session, row);
  const insertion = new Insertion(session, target);
  new ModePicker(session.app, insertion.modes()).open();
}

function chosen(session: Session, row: Row): void {
  void attempt(() => start(session, row));
}

export async function insertFromPinax(session: Session): Promise<void> {
  const rows = await session.store.rows();
  const reachable = rows.filter(isReachable);
  if (reachable.length === 0) {
    throw new Error("no pinax reachable here: run Register pinax");
  }
  const picker = new PinaxPicker(session.app, reachable, (row) => chosen(session, row));
  picker.open();
}
