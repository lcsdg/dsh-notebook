/**
 * Per-session notepad store over the `notebook` settings namespace.
 *
 * One store is created per session (the header-action inject factory is
 * session-scoped), so every conversation owns an isolated note list.
 *
 * Reads go through a synchronous in-memory mirror of the session entry
 * (authoritative for this store), so mutations reflect immediately and the
 * create-then-fill "add to notebook" flow is safe even though `scope.set` is
 * async. Persists replace this session's entry in the settings document and
 * are debounced for content edits. The store notifies its listeners on every
 * mutation (and on external settings change) so the panel re-renders.
 */
import type { SessionId, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { Note, NotebookSettings, SessionNotes } from '../types.ts';
/** Validation outcome for a name-only mutation (empty or duplicate rejected). */
export type NameResult = {
    ok: true;
    note: Note;
} | {
    ok: false;
    error: 'empty' | 'duplicate';
};
/** Result of a content-save request — always local; persistence is debounced. */
export interface NoteStore {
    readonly sessionId: SessionId;
    /** Read the current session entry (in-memory; never creates one). */
    getSession(): SessionNotes;
    /** Read one note by id; undefined when absent. */
    getNote(id: string): Note | undefined;
    /** Create a note (lazy-creates the session entry) and select it. */
    addNote(name: string): NameResult;
    /** Rename a note; empty/duplicate rejected. */
    renameNote(id: string, name: string): NameResult;
    /** Delete a note and repair the active selection (first remaining, or ''). */
    removeNote(id: string): void;
    /** Select a note as active (id must exist). */
    setActiveNote(id: string): void;
    /** Persist the footer send mode ('append' | 'replace'). */
    setAppendMode(mode: 'append' | 'replace'): void;
    /** Observe mutations (and external settings changes). */
    subscribe(listener: () => void): () => void;
    /** Debounced content write (coalesces rapid edits). */
    scheduleContentSave(noteId: string, content: string): void;
    /** Force any pending content write immediately. */
    flushContent(): void;
    /** Cancel any pending content write (e.g. on dispose). */
    dispose(): void;
}
/**
 * Build the per-session store.
 * @param scope - the bound `notebook` settings scope.
 * @param sessionId - the owning session id.
 */
export declare function createSessionNoteStore(scope: SettingsScope<NotebookSettings>, sessionId: SessionId): NoteStore;
