/**
 * Shared type surface for dsh-notebook: one note, one session's notepad, and
 * the settings-section shape. Kept here (not in the host entry) so the
 * browser half can import the types without a Host package dependency.
 */

/** One note: user-added text collected from a conversation. */
export interface Note {
  /** Stable unique id (kept when the user edits name/content). */
  id: string
  /** Display name (trimmed, non-empty, unique within a session). */
  name: string
  /** Plain-text note body. */
  content: string
  /** Unix epoch ms at creation. */
  createdAt: number
  /** Unix epoch ms at last modification. */
  updatedAt: number
}

/** One session's notepad: its note list plus its active selection. */
export interface SessionNotes {
  /** Owner session id (the conversation this notepad belongs to). */
  sessionId: string
  /** Ordered note list (array order is the display order). */
  notes: Note[]
  /** Id of the note currently open ('' when none). */
  activeNoteId: string
  /** Last chosen footer send mode (true = append, false = replace). */
  appendMode?: boolean
}

/** The settings-section shape for the notebook settings namespace. */
export interface NotebookSettings {
  /**
   * Per-session notepads, keyed by sessionId at runtime via a Map built from
   * this array. Kept as an array (not a record) so the schemastery schema and
   * round-tripping stay simple; entries are added lazily the first time a
   * session's notepad is opened.
   */
  sessions: SessionNotes[]
}

/** Empty shape; a new session's notepad starts here (lazy, empty). */
export const EMPTY_SESSION_NOTES: Omit<SessionNotes, 'sessionId'> = {
  notes: [],
  activeNoteId: '',
}

/**
 * Normalize any stored section into the current shape, migrating a missing
 * or malformed field to a safe default. Purely derived — nothing is written
 * back until the user edits through the panel.
 * @param raw - the stored (schema-resolved) section value.
 * @returns the normalized shape.
 */
export function normalizeSettings(raw: NotebookSettings | undefined): NotebookSettings {
  const sessions: SessionNotes[] = []
  for (const entry of raw?.sessions ?? []) {
    const sessionId = typeof entry?.sessionId === 'string' ? entry.sessionId : ''
    if (sessionId === '') continue
    const notes: Note[] = (entry?.notes ?? []).map((n) => ({
      id: typeof n?.id === 'string' ? n.id : '',
      name: typeof n?.name === 'string' ? n.name : '',
      content: typeof n?.content === 'string' ? n.content : '',
      createdAt: typeof n?.createdAt === 'number' ? n.createdAt : Date.now(),
      updatedAt: typeof n?.updatedAt === 'number' ? n.updatedAt : Date.now(),
    })).filter((n) => n.id !== '')
    const activeNoteId = notes.some((n) => n.id === entry?.activeNoteId)
      ? (entry?.activeNoteId ?? '')
      : (notes.length > 0 ? notes[0].id : '')
    sessions.push({ sessionId, notes, activeNoteId, appendMode: typeof entry?.appendMode === 'boolean' ? entry.appendMode : true })
  }
  return { sessions }
}

/** Stable settings namespace (spelled identically in the host entry). */
export const NOTEBOOK_NAMESPACE = 'notebook'
