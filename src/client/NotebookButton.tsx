/**
 * The session-header action entry for dsh-notebook: a "记事本" button that
 * drops a non-modal, click-outside-to-close panel below itself, plus the
 * document-level text-selection observer that surfaces the floating
 * "添加到记事本" button and its target/mode popup.
 *
 * Owner props for the session-header actions seat are empty, so the
 * framework session standard kit supplies sessionId/useSession/etc. and the
 * injected business face (per-session note store + input/send ports) comes
 * from the client entry's inject factory.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NoteStore } from './note-store.ts'
import { observeSelection, clearActiveSelection, NOTEBOOK_UI_ATTR, type ActiveSelection } from './selection.ts'
import { NotebookPanel } from './NotebookPanel.tsx'
import { AddToNotebookPopup } from './AddToNotebookPopup.tsx'
import type { NotebookKey } from './locales.ts'
import css from './notebook.module.css'

/** Business face supplied by the client entry (see src/client/index.ts). */
export interface NotebookInjected {
  /** Per-session note store (isolated by sessionId). */
  store: NoteStore
  /** Place `text` into this session's composer input (append or replace). */
  insertIntoInput: (text: string, mode: 'append' | 'replace') => void
  /** Send `text` as a queued user prompt; resolves to success. */
  sendPrompt: (text: string) => Promise<boolean>
}

export interface NotebookButtonProps
  extends NotebookInjected,
  PropsLocale<'notebook'> {
  /** The current session id (framework standard kit). */
  sessionId: SessionId
}

/** One snapped panel position (fixed coords). */
interface PanelAnchor {
  top: number
  left: number
}

const BOOK_ICON = (
  <svg className={css.buttonIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2.5h3.5A1.5 1.5 0 0 1 8 4v10a1.5 1.5 0 0 0-1.5-1.5H3z" />
    <path d="M13 2.5H9.5A1.5 1.5 0 0 0 8 4v10a1.5 1.5 0 0 1 1.5-1.5H13z" />
  </svg>
)

/** Clamp a panel's left edge so it stays inside the viewport. */
function clampLeft(left: number, width: number): number {
  const max = Math.max(8, window.innerWidth - width - 8)
  return Math.min(Math.max(8, left), max)
}

/**
 * Locate the session header's view-tab strip (对话/轨迹/上下文). The tabs
 * row has no slot of its own, so the button is portaled INTO it to sit beside
 * the view tabs. Returns null when the strip is absent (single-tab sessions
 * hide it) — the caller then falls back to its native seat.
 */
function findSessionTabRow(): HTMLElement | null {
  for (const header of document.querySelectorAll<HTMLElement>('header')) {
    const nav = header.querySelector('nav[aria-label]')
    const label = nav?.getAttribute('aria-label') ?? ''
    if (/会话层级|hierarchy/i.test(label)) {
      return header.querySelector<HTMLElement>('div[role="tablist"]') ?? null
    }
  }
  return null
}

/**
 * The header action component. Renders the button (portaled into the session
 * tab strip when one exists); opens/closes the dropdown panel; observes text
 * selection and hosts the floating add button + popup.
 */
export function NotebookButton(props: NotebookButtonProps): React.JSX.Element {
  const { store, insertIntoInput, sendPrompt, sessionId, t } = props
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<PanelAnchor | null>(null)
  /** Current actionable text selection (floating add button), or null. */
  const [selection, setSelection] = useState<ActiveSelection | null>(null)
  /** Mirror of the latest actionable selection, immune to render timing. */
  const selectionRef = useRef<ActiveSelection | null>(null)
  /** Frozen popup text (the popup must survive the live selection collapsing). */
  const [popupText, setPopupText] = useState('')
  /** Whether the add-to-notebook popup is open. */
  const [popupOpen, setPopupOpen] = useState(false)
  /** The session tab strip DOM node (button host), or null for the fallback seat. */
  const [tabRow, setTabRow] = useState<HTMLElement | null>(null)

  // Re-resolve on every commit: the strip appears/disappears with the header.
  useLayoutEffect(() => {
    const row = findSessionTabRow()
    setTabRow((prev) => (prev === row ? prev : row))
  })

  // Observe selection for the "add to notebook" affordance.
  useEffect(() => observeSelection((sel) => {
    if (sel !== null) selectionRef.current = sel
    setSelection(sel)
  }), [])

  // Flush any pending content save before unload; dispose the store on unmount.
  useEffect(() => {
    const flush = (): void => store.flushContent()
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      store.dispose()
    }
  }, [store])

  const openPanel = (): void => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect === undefined) return
    setAnchor({ top: Math.round(rect.bottom + 6), left: Math.round(rect.left) })
    setOpen(true)
  }

  const closePanel = (): void => {
    store.flushContent()
    setOpen(false)
  }

  // Click-outside closes the panel (non-modal dropdown behavior).
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent): void => {
      const target = e.target as Node
      if (panelRef.current?.contains(target) === true) return
      if (buttonRef.current?.contains(target) === true) return
      closePanel()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, store])

  const handleAdd = (): void => {
    const sel = selectionRef.current
    if (sel === null) return
    setPopupText(sel.text)
    setPopupOpen(true)
  }

  const finishAdd = (): void => {
    setPopupOpen(false)
    setPopupText('')
    selectionRef.current = null
    setSelection(null)
    clearActiveSelection()
  }

  const headerButton = (
    <button
      ref={buttonRef}
      type="button"
      data-notebook-ui
      className={tabRow !== null
        ? `${css.tabButton}${open ? ` ${css.tabButtonOpen}` : ''}`
        : `${css.headerButton}${open ? ` ${css.headerButtonOpen}` : ''}`}
      title={t('button.manage')}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => (open ? closePanel() : openPanel())}
    >
      {BOOK_ICON}
      <span className={css.headerLabel}>{t('button.title')}</span>
    </button>
  )

  return (
    <>
      {tabRow !== null ? createPortal(headerButton, tabRow) : headerButton}

      {open && anchor !== null ? createPortal(
        <div
          ref={panelRef}
          className={css.panel}
          style={{ top: anchor.top, left: clampLeft(anchor.left, PANEL_WIDTH) }}
          role="dialog"
          aria-modal="false"
          data-notebook-ui
        >
          <NotebookPanel
            store={store}
            insertIntoInput={insertIntoInput}
            sendPrompt={sendPrompt}
            sessionId={sessionId}
            t={t}
            onClose={closePanel}
          />
        </div>,
        document.body,
      ) : null}

      {!open && selection !== null && !popupOpen ? createPortal(
        <button
          type="button"
          className={css.addButton}
          style={{
            left: (selection.mouseX ?? selection.x) + 10,
            top: (selection.mouseY ?? selection.y) + 12,
          }}
          title={t('addButton.label')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAdd}
          data-notebook-ui
        >
          <span className={css.addButtonIcon}>＋</span>
          {t('addButton.label')}
        </button>,
        document.body,
      ) : null}

      {popupOpen ? createPortal(
        <AddToNotebookPopup
          store={store}
          text={popupText}
          t={t}
          onClose={finishAdd}
          onDone={finishAdd}
        />,
        document.body,
      ) : null}
    </>
  )
}

/** Panel width (px) used for viewport clamping. */
const PANEL_WIDTH = 960

/** Re-export so the client entry can name the locale key type. */
export type NotebookButtonLocaleKey = NotebookKey
