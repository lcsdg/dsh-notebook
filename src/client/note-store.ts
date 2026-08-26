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
import type { SessionId, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { Note, NotebookSettings, SessionNotes } from '../types.ts'
import { normalizeSettings } from '../types.ts'

/** Validation outcome for a name-only mutation (empty or duplicate rejected). */
export type NameResult =
  | { ok: true; note: Note }
  | { ok: false; error: 'empty' | 'duplicate' }

/** Result of a content-save request — always local; persistence is debounced. */
export interface NoteStore {
  readonly sessionId: SessionId
  /** Read the current session entry (in-memory; never creates one). */
  getSession(): SessionNotes
  /** Read one note by id; undefined when absent. */
  getNote(id: string): Note | undefined
  /** Create a note (lazy-creates the session entry) and select it. */
  addNote(name: string): NameResult
  /** Rename a note; empty/duplicate rejected. */
  renameNote(id: string, name: string): NameResult
  /** Delete a note and repair the active selection (first remaining, or ''). */
  removeNote(id: string): void
  /** Select a note as active (id must exist). */
  setActiveNote(id: string): void
  /** Persist the footer send mode ('append' | 'replace'). */
  setAppendMode(mode: 'append' | 'replace'): void
  /** Observe mutations (and external settings changes). */
  subscribe(listener: () => void): () => void
  /** Debounced content write (coalesces rapid edits). */
  scheduleContentSave(noteId: string, content: string): void
  /** Force any pending content write immediately. */
  flushContent(): void
  /** Cancel any pending content write (e.g. on dispose). */
  dispose(): void
}

/** Debounce window for content auto-save (ms). */
const SAVE_DEBOUNCE_MS = 600

function classifyName(name: string, notes: readonly Note[]): { error?: 'empty' | 'duplicate' } {
  const trimmed = name.trim()
  if (trimmed === '') return { error: 'empty' }
  if (notes.some((n) => n.name === trimmed)) return { error: 'duplicate' }
  return {}
}

/** Clone a session entry so the reference changes (triggers React re-render). */
function cloneSession(s: SessionNotes): SessionNotes {
  return { sessionId: s.sessionId, notes: s.notes.map((n) => ({ ...n })), activeNoteId: s.activeNoteId }
}

/**
 * Build the per-session store.
 * @param scope - the bound `notebook` settings scope.
 * @param sessionId - the owning session id.
 */
export function createSessionNoteStore(scope: SettingsScope<NotebookSettings>, sessionId: SessionId): NoteStore {
  const listeners = new Set<() => void>()
  /** In-memory mirror; authoritative for reads. Initialized lazily. */
  let memo: SessionNotes | null = null
  let contentTimer: ReturnType<typeof setTimeout> | null = null
  let pending: { noteId: string; content: string } | null = null

  const notify = (): void => {
    for (const listener of [...listeners]) {
      try {
        listener()
      } catch {
        // A listener must never break the store.
      }
    }
  }

  const readScopeSession = (): SessionNotes | undefined =>
    normalizeSettings(scope.getSnapshot().value).sessions.find((s) => s.sessionId === sessionId)

  const current = (): SessionNotes => {
    if (memo === null) memo = readScopeSession() ?? { sessionId, notes: [], activeNoteId: '' }
    return memo
  }

  const findNoteIn = (session: SessionNotes, id: string): Note | undefined => session.notes.find((n) => n.id === id)

  /** Replace the mirror, write it back to settings (this session's entry), notify. */
  const commit = (next: SessionNotes): void => {
    memo = next
    const list = normalizeSettings(scope.getSnapshot().value).sessions
    const index = list.findIndex((s) => s.sessionId === sessionId)
    const out = [...list]
    if (index >= 0) out[index] = next
    else out.push(next)
    void scope.set('sessions', out)
    notify()
  }

  const flushTimer = (): void => {
    if (contentTimer !== null) {
      clearTimeout(contentTimer)
      contentTimer = null
    }
  }

  const getSession = (): SessionNotes => cloneSession(current())

  const getNote = (id: string): Note | undefined => current().notes.find((n) => n.id === id)

  const addNote = (rawName: string): NameResult => {
    const session = current()
    const check = classifyName(rawName, session.notes)
    if (check.error !== undefined) return { ok: false, error: check.error }
    const now = Date.now()
    const note: Note = {
      id: crypto.randomUUID(),
      name: rawName.trim(),
      content: '',
      createdAt: now,
      updatedAt: now,
    }
    const next: SessionNotes = {
      ...session,
      notes: [...session.notes, note],
      activeNoteId: note.id,
    }
    commit(next)
    return { ok: true, note }
  }

  const renameNote = (id: string, rawName: string): NameResult => {
    const session = current()
    const note = findNoteIn(session, id)
    if (note === undefined) return { ok: false, error: 'empty' }
    const check = classifyName(rawName, session.notes.filter((n) => n.id !== id))
    if (check.error !== undefined) return { ok: false, error: check.error }
    if (note.name === rawName.trim()) return { ok: true, note }
    const renamed: Note = { ...note, name: rawName.trim(), updatedAt: Date.now() }
    commit({ ...session, notes: session.notes.map((n) => (n.id === id ? renamed : n)) })
    return { ok: true, note: renamed }
  }

  const removeNote = (id: string): void => {
    const session = current()
    const remaining = session.notes.filter((n) => n.id !== id)
    if (remaining.length === session.notes.length) return
    let activeNoteId = session.activeNoteId
    if (activeNoteId === id) activeNoteId = remaining.length > 0 ? remaining[0].id : ''
    commit({ ...session, notes: remaining, activeNoteId })
  }

  const setActiveNote = (id: string): void => {
    const session = current()
    if (findNoteIn(session, id) === undefined) return
    if (session.activeNoteId === id) return
    commit({ ...session, activeNoteId: id })
  }

  const setAppendMode = (mode: 'append' | 'replace'): void => {
    const session = current()
    const appendMode = mode === 'append'
    if (session.appendMode === appendMode) return
    commit({ ...session, appendMode })
  }

  const scheduleContentSave = (noteId: string, content: string): void => {
    pending = { noteId, content }
    flushTimer()
    contentTimer = setTimeout(() => {
      contentTimer = null
      const job = pending
      pending = null
      if (job === null) return
      const session = current()
      if (findNoteIn(session, job.noteId) === undefined) return
      commit({
        ...session,
        notes: session.notes.map((n) => (n.id === job.noteId ? { ...n, content: job.content, updatedAt: Date.now() } : n)),
      })
    }, SAVE_DEBOUNCE_MS)
  }

  const flushContent = (): void => {
    if (pending === null) return
    const job = pending
    pending = null
    flushTimer()
    const session = current()
    if (findNoteIn(session, job.noteId) === undefined) return
    commit({
      ...session,
      notes: session.notes.map((n) => (n.id === job.noteId ? { ...n, content: job.content, updatedAt: Date.now() } : n)),
    })
  }

  const dispose = (): void => {
    flushTimer()
    pending = null
    listeners.clear()
  }

  return {
    sessionId,
    getSession,
    getNote,
    addNote,
    renameNote,
    removeNote,
    setActiveNote,
    setAppendMode,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    scheduleContentSave,
    flushContent,
    dispose,
  }
}
