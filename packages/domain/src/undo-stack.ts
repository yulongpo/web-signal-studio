/**
 * Domain undo/redo stack for project + annotation mutations (not UI).
 * Commands mutate held document state via redo()/undo(); IQ buffers are never cloned.
 */

export interface UndoCommand {
  /** Stable id for diagnostics / coalescing. */
  id: string;
  /** Short human label (also useful for undo menus). */
  label: string;
  undo(): void;
  redo(): void;
}

export interface UndoStackOptions {
  /** Max commands retained on the undo side (default 100). */
  limit?: number;
}

export class UndoStack {
  private readonly undoStack: UndoCommand[] = [];
  private readonly redoStack: UndoCommand[] = [];
  private readonly limit: number;

  constructor(options: UndoStackOptions = {}) {
    const limit = options.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1) {
      throw new RangeError(`UndoStack limit must be a positive integer, got ${limit}`);
    }
    this.limit = limit;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoDepth(): number {
    return this.undoStack.length;
  }

  get redoDepth(): number {
    return this.redoStack.length;
  }

  /** Label of the next undo, if any. */
  get undoLabel(): string | undefined {
    return this.undoStack[this.undoStack.length - 1]?.label;
  }

  /** Label of the next redo, if any. */
  get redoLabel(): string | undefined {
    return this.redoStack[this.redoStack.length - 1]?.label;
  }

  /**
   * Apply `command.redo()` and push onto the undo stack.
   * Clears the redo stack (branching history).
   * Evicts oldest undo entries when over `limit`.
   */
  push(command: UndoCommand): void {
    command.redo();
    this.undoStack.push(command);
    this.redoStack.length = 0;
    while (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
  }

  /**
   * Push without calling redo — use when the mutation was already applied
   * (e.g. live drag committed at pointer-up). Still clears redo.
   */
  pushAlreadyApplied(command: UndoCommand): void {
    this.undoStack.push(command);
    this.redoStack.length = 0;
    while (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
  }

  undo(): UndoCommand | undefined {
    const command = this.undoStack.pop();
    if (!command) return undefined;
    command.undo();
    this.redoStack.push(command);
    return command;
  }

  redo(): UndoCommand | undefined {
    const command = this.redoStack.pop();
    if (!command) return undefined;
    command.redo();
    this.undoStack.push(command);
    return command;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}

/** @deprecated Prefer UndoStack; alias kept for HistoryStack naming. */
export { UndoStack as HistoryStack };
