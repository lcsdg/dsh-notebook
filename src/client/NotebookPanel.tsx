/**
 * The dropdown panel content: a left rail of this session's notes
 * (add/rename/delete with confirm, active selection, empty state) and a
 * right editing pane for the active note (directly editable, auto-saved with
 * a debounce, flushed on switch/blur/close), plus the send/sync footer.
 *
 * All edits stage in local state and persist through the per-session note
 * store; content writes are debounced by the store and coalesced.
 */
import { useEffect, useMemo, useState } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { Note, SessionNotes } from '../types.ts'
import type { NotebookInjected } from './NotebookButton.tsx'
import type { NotebookKey } from './locales.ts'
import css from './notebook.module.css'

export interface NotebookPanelProps
  extends NotebookInjected,
  PropsLocale<'notebook'> {
  sessionId: SessionId
  /** Close the panel (flushes pending content). */
  onClose: () => void
}

type SaveState = 'saved' | 'saving'

const ADD_ICON = <span className={css.railAddIcon} aria-hidden="true">＋</span>

/** Inline name validation error key ('' = none). */
function nameError(result: { ok: boolean; error?: 'empty' | 'duplicate' }, t: (k: NotebookKey) => string): string {
  if (result.ok) return ''
  if (result.error === 'empty') return t('panel.nameEmpty')
  if (result.error === 'duplicate') return t('panel.duplicate')
  return ''
}

/**
 * The dropdown panel body. Rendered inside a portal by {@link NotebookButton}.
 */
export function NotebookPanel(props: NotebookPanelProps): React.JSX.Element {
  const { store, insertIntoInput, sendPrompt, t, onClose } = props
  const [session, setSession] = useState<SessionNotes>(() => store.getSession())
  const [adding, setAdding] = useState(false)
  const [addDraft, setAddDraft] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [formError, setFormError] = useState('')
  /** Live editor draft for the active note. */
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendOk, setSendOk] = useState(false)

  const notes = useMemo(() => session.notes, [session.notes])
  const activeId = session.activeNoteId
  const activeNote = notes.find((n) => n.id === activeId) ?? null

  // Re-read the session when the settings scope changes (persists land here).
  useEffect(() => store.subscribe(() => setSession(store.getSession())), [store])

  // Seed the editor draft whenever the active note changes.
  useEffect(() => {
    setContent(activeNote?.content ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  // Save state: draft differs from the persisted note content → saving.
  const saveState: SaveState = activeNote !== null && content !== activeNote.content ? 'saving' : 'saved'

  const flush = (): void => store.flushContent()

  const onContentChange = (value: string): void => {
    setContent(value)
    if (activeNote !== null) store.scheduleContentSave(activeNote.id, value)
    setSendError(null)
    setSendOk(false)
  }

  const selectNote = (id: string): void => {
    flush()
    store.setActiveNote(id)
  }

  const beginAdd = (): void => {
    setAdding(true)
    setAddDraft('')
    setFormError('')
  }

  const commitAdd = (): void => {
    const result = store.addNote(addDraft)
    if (!result.ok) {
      setFormError(nameError(result, t))
      return
    }
    setAdding(false)
    setAddDraft('')
    setFormError('')
  }

  const beginRename = (note: Note): void => {
    setRenamingId(note.id)
    setRenameDraft(note.name)
    setFormError('')
  }

  const commitRename = (): void => {
    const id = renamingId
    setRenamingId(null)
    setFormError('')
    if (id === null) return
    const result = store.renameNote(id, renameDraft)
    if (!result.ok) {
      setFormError(nameError(result, t))
    }
  }

  const confirmDelete = (): void => {
    if (confirmId !== null) {
      flush()
      store.removeNote(confirmId)
    }
    setConfirmId(null)
  }

  const confirmClearText = (): void => {
    if (activeNote !== null) {
      setContent('')
      store.scheduleContentSave(activeNote.id, '')
      store.flushContent()
    }
    setConfirmClear(false)
    setSendError(null)
    setSendOk(false)
  }

  const canSend = activeNote !== null && content !== '' && !sending

  const handleDirectSend = async (): Promise<void> => {
    if (!canSend) return
    setSending(true)
    setSendError(null)
    setSendOk(false)
    const ok = await sendPrompt(content)
    setSending(false)
    if (ok) {
      setSendOk(true)
      onClose()
    } else {
      setSendError(t('panel.sendFailed', { reason: t('panel.sendFailedReason') }))
    }
  }

  const handleSyncToInput = (): void => {
    if (!canSend) return
    insertIntoInput(content, 'append')
    setSendOk(true)
    onClose()
  }

  return (
    <div className={css.wrap}>
      <div className={css.header}>
        <span className={css.panelTitle}>{t('panel.title')}</span>
        <span className={css.spacer} />
        <button type="button" className={css.closeButton} title={t('panel.close')} aria-label={t('panel.close')} onClick={onClose}>
          ×
        </button>
      </div>
      <div className={css.split}>
      {/* ---- left rail: notes ---- */}
      <div className={css.rail}>
        <div className={css.railHeader}>
          <span className={css.railTitle}>{t('panel.title')}</span>
          <button type="button" className={css.iconButton} onClick={beginAdd} title={t('panel.addNote')}>
            {ADD_ICON}
          </button>
        </div>
        <div className={css.railList}>
          {notes.length === 0 && !adding ? (
            <span className={css.hint}>{t('panel.empty')}</span>
          ) : null}
          {notes.map((note) => (
            <div key={note.id} className={`${css.railRow}${note.id === activeId ? ` ${css.railRowActive}` : ''}`}>
              {renamingId === note.id ? (
                <input
                  className={css.railInput}
                  value={renameDraft}
                  autoFocus
                  placeholder={t('panel.noteNamePlaceholder')}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                />
              ) : (
                <button type="button" className={css.railButton} onClick={() => selectNote(note.id)}>
                  <span className={css.railName}>{note.name || '…'}</span>
                </button>
              )}
              {renamingId !== note.id ? (
                <span className={css.railActions}>
                  <button type="button" className={css.iconButton} title={t('panel.rename')} onClick={() => beginRename(note)}>✎</button>
                  <button type="button" className={`${css.iconButton} ${css.danger}`} title={t('panel.remove')} onClick={() => setConfirmId(note.id)}>×</button>
                </span>
              ) : null}
            </div>
          ))}
          {adding ? (
            <div className={css.railRow}>
              <input
                className={css.railInput}
                value={addDraft}
                autoFocus
                placeholder={t('panel.noteNamePlaceholder')}
                onChange={(e) => setAddDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitAdd()
                  if (e.key === 'Escape') { setAdding(false); setAddDraft(''); setFormError('') }
                }}
              />
            </div>
          ) : null}
          {formError !== '' ? <span className={css.hint}>{formError}</span> : null}
        </div>
      </div>

      {/* ---- right pane: editor ---- */}
      <div className={css.pane}>
        {activeNote === null ? (
          <div className={css.emptyPane}>
            <span className={css.hint}>{t('panel.noNoteSelected')}</span>
            <button type="button" className={css.button} onClick={beginAdd}>{t('panel.addNote')}</button>
          </div>
        ) : (
          <>
            <div className={css.editorHeader}>
              <span className={css.saveState} data-state={saveState}>
                {saveState === 'saving' ? t('panel.saveState.saving') : t('panel.saveState.saved')}
              </span>
              <button
                type="button"
                className={css.clearButton}
                title={t('panel.clearText')}
                disabled={content === ''}
                onClick={() => setConfirmClear(true)}
              >
                {t('panel.clearText')}
              </button>
            </div>
            <textarea
              className={css.editor}
              value={content}
              placeholder={t('panel.contentPlaceholder')}
              onChange={(e) => onContentChange(e.target.value)}
              onBlur={flush}
              spellCheck={false}
            />
            {sendError !== null ? <span className={css.error}>{sendError}</span> : null}
            {sendOk ? <span className={css.ok}>{t('panel.sendOk')}</span> : null}

            <div className={css.actions}>
              <span className={css.spacer} />
              <button type="button" className={css.button} disabled={!canSend} onClick={handleSyncToInput}>
                {t('panel.syncToInput')}
              </button>
              <button type="button" className={css.primary} disabled={!canSend} onClick={() => void handleDirectSend()}>
                {sending ? '…' : t('panel.directSend')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ---- delete confirm ---- */}
      {confirmId !== null ? (
        <div className={css.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmId(null) }}>
          <div className={`${css.card} ${css.confirmCard}`} role="alertdialog" aria-modal="true">
            <p className={css.title}>{t('panel.confirmDeleteTitle')}</p>
            <span className={css.hint}>{t('panel.confirmDeleteNote', { name: notes.find((n) => n.id === confirmId)?.name ?? '' })}</span>
            <div className={css.actions}>
              <span className={css.spacer} />
              <button type="button" className={css.button} onClick={() => setConfirmId(null)}>{t('panel.cancel')}</button>
              <button type="button" className={css.dangerPrimary} onClick={confirmDelete}>{t('panel.delete')}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---- clear-content confirm ---- */}
      {confirmClear ? (
        <div className={css.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmClear(false) }}>
          <div className={`${css.card} ${css.confirmCard}`} role="alertdialog" aria-modal="true">
            <p className={css.title}>{t('panel.confirmClearTitle')}</p>
            <span className={css.hint}>{t('panel.confirmClearNote', { name: activeNote?.name ?? '' })}</span>
            <div className={css.actions}>
              <span className={css.spacer} />
              <button type="button" className={css.button} onClick={() => setConfirmClear(false)}>{t('panel.cancel')}</button>
              <button type="button" className={css.dangerPrimary} onClick={confirmClearText}>{t('panel.clear')}</button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  )
}

/** Re-export so the button can label the key type uniformly. */
export type NotebookPanelLocaleKey = NotebookKey
