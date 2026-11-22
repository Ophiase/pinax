import { Notice } from "obsidian";

export function say(message: string): void {
  new Notice(`Pinax: ${message}`);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Runs an action; its failure becomes a notice instead of a silent reject. */
export async function attempt(action: () => unknown): Promise<void> {
  try {
    await action();
  } catch (error) {
    say(messageOf(error));
  }
}
