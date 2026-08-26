/**
 * "Add to notebook" popup: choose a target note (create one inline when the
 * session has none) and a write mode (append/overwrite), then commit the
 * selected text immediately to the session's note store.
 *
 * Append inserts a blank line between the existing content and the selection;
 * overwrite replaces it and is flagged as destructive.
 */
import { useEffect, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NoteStore } from './note-store.ts'
import type { NotebookKey } from './locales.ts'
import css from './notebook.module.css'

export interface AddToNotebookPopupProps extends PropsLocale<'notebook'> {
  /** Per-session note store. */
  store: NoteStore
  /** The selected text to add. */
  text: string
  /** Close without adding (or after a successful add). */
  onClose: () => void
  /** Close after a successful add. */
  onDone: () => void
}

type Mode = 'append' | 'overwrite'

/** Join the selection onto existing content (append adds a blank line). */
function joinContent(existing: string, text: string, mode: Mode): string {
  if (mode === 'overwrite') return text
  return existing === '' ? text : `${existing}\n\n${text}`
}

/**
 * The target/mode popup. Rendered inside a portal by {@link NotebookButton}.
 */
export function AddToNotebookPopup(props: AddToNotebookPopupProps): React.JSX.Element {
  const { store, text, t, onClose, onDone } = props
  const [selectedId, setSelectedId] = useState<string>(() => store.getSession().activeNoteId)
  const [mode, setMode] = useState<Mode>(() => (store.getSession().appendMode === false ? 'overwrite' : 'append'))
  const [adding, setAdding] = useState(false)
  const [addName, setAddName] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  const session = store.getSession()
  const notes = session.notes
  const selected = notes.find((n) => n.id === selectedId) ?? null

  // Keep selection valid as the store re-reads ('' = intentional create mode).
  useEffect(() => {
    if (selectedId === '') return
    if (notes.length > 0 && !notes.some((n) => n.id === selectedId)) {
      setSelectedId(notes[0].id)
    }
  }, [notes, selectedId])

  const selectNote = (id: string): void => {
    // Picking an existing note also leaves create mode: the target is that note.
    setSelectedId(id)
    setAdding(false)
    setAddName('')
    setFormError('')
  }

  const commitAdd = (targetId: string, targetMode: Mode): void => {
    store.scheduleContentSave(targetId, joinContent(store.getNote(targetId)?.content ?? '', text, targetMode))
    store.flushContent()
    setSuccess(true)
    window.setTimeout(() => onDone(), 700)
  }

  const confirmAdd = (): void => {
    // While creating inline, the new note IS the target — create it and add
    // into it (the "+" click already switched the selection away from the
    // previously highlighted note).
    if (adding) {
      if (addName.trim() === '') {
        setFormError(t('panel.nameEmpty'))
        return
      }
      const result = store.addNote(addName)
      if (!result.ok) {
        setFormError(result.error === 'empty' ? t('panel.nameEmpty') : t('panel.duplicate'))
        return
      }
      setSelectedId(result.note.id)
      commitAdd(result.note.id, mode)
      return
    }
    if (selected !== null) commitAdd(selected.id, mode)
  }

  const canSubmit = selected !== null || (adding && addName.trim() !== '')

  const beginCreate = (): void => {
    setAdding(true)
    setAddName('')
    setFormError('')
    // The new note becomes the target: drop the previous highlight so the
    // user sees the switch immediately.
    setSelectedId('')
  }

  return (
    <div className={css.overlay} data-notebook-ui onMouseDown={(e) => { if (e.target === e.currentTarget && !success) onClose() }}>
      <div className={`${css.card} ${css.popupCard}`} role="dialog" aria-modal="true">
        <p className={css.title}>{t('popup.title')}</p>

        {success ? (
          <span className={css.ok}>{t('popup.added')}</span>
        ) : (
          <>
            <div className={css.fieldSection}>
              <span className={css.label}>{t('popup.selectNote')}</span>
              {notes.length === 0 && !adding ? (
                <button type="button" className={css.railAddButton} onClick={beginCreate}>{t('popup.createNote')}</button>
              ) : (
                <div className={css.noteList}>
                  {notes.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`${css.noteRow}${n.id === selectedId ? ` ${css.noteRowActive}` : ''}`}
                      onClick={() => selectNote(n.id)}
                    >
                      <span className={css.noteRowName}>{n.name || '…'}</span>
                    </button>
                  ))}
                  {adding ? (
                    <input
                      className={css.railInput}
                      value={addName}
                      autoFocus
                      placeholder={t('panel.noteNamePlaceholder')}
                      onChange={(e) => setAddName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmAdd() }}
                    />
                  ) : notes.length > 0 && !adding ? (
                    <button type="button" className={css.noteRowAdd} onClick={beginCreate}>＋</button>
                  ) : null}
                </div>
              )}
              {formError !== '' ? <span className={css.hint}>{formError}</span> : null}
            </div>

            <div className={css.fieldSection}>
              <span className={css.label}>{t('popup.mode')}</span>
              <div className={css.modeRow}>
                <label className={css.modeOption}>
                  <input type="radio" name="notebook-mode" checked={mode === 'append'} onChange={() => { setMode('append'); store.setAppendMode('append') }} />
                  <span>{t('popup.append')}</span>
                </label>
                <label className={css.modeOption}>
                  <input type="radio" name="notebook-mode" checked={mode === 'overwrite'} onChange={() => { setMode('overwrite'); store.setAppendMode('replace') }} />
                  <span>{t('popup.overwrite')}</span>
                </label>
              </div>
              <span className={mode === 'overwrite' ? css.warn : css.hint}>
                {mode === 'overwrite' ? t('popup.overwriteHint') : t('popup.appendHint')}
              </span>
            </div>

            <div className={css.actions}>
              <span className={css.spacer} />
              <button type="button" className={css.button} onClick={onClose}>{t('panel.cancel')}</button>
              <button type="button" className={css.primary} disabled={!canSubmit} onClick={confirmAdd}>
                {t('popup.add')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
