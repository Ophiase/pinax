import type { App } from "obsidian";
import { attempt, say } from "../notice.ts";
import type { Row } from "../registry/index.ts";
import { isReachable, PinaxPicker, unreachable } from "./picker.ts";
import type { Pinakes } from "./store.ts";

function openRow(store: Pinakes, row: Row): void {
  if (!isReachable(row)) {
    say(unreachable(row));
    return;
  }
  void attempt(() => store.open(row));
}

export async function openPinax(app: App, store: Pinakes): Promise<void> {
  const rows = await store.rows();
  if (rows.length === 0) {
    throw new Error("no pinax tracked yet: run Register pinax");
  }
  new PinaxPicker(app, rows, (row) => openRow(store, row)).open();
}
