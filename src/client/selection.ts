/**
 * Document-level text-selection observer for the "add to notebook" affordance.
 *
 * There is no DSH slot for transcript text selection, so this listens for
 * selection changes at the document level and reports a non-chat, non-empty
 * text selection as an anchored point. The caller renders a floating button
 * near the reported rect. Selections inside form controls (the composer) or
 * inside this plugin's own UI are ignored so the affordance only appears for
 * chat-message text.
 */

/** One observed, actionable selection. */
export interface ActiveSelection {
  /** The trimmed selected text. */
  text: string
  /** Recomputed right edge of the selection rect (fixed coords). */
  x: number
  /** Recomputed top edge of the selection rect (fixed coords). */
  y: number
  /** Mouse anchor (mouseup position), preferred over x/y when present. */
  mouseX?: number
  mouseY?: number
}

/** Attribute stamped on this plugin's own UI roots so their selections are ignored. */
export const NOTEBOOK_UI_ATTR = 'data-notebook-ui'

/** Whether a selection is anchored inside a control or this plugin's own UI. */
function isIgnoredTarget(node: Node | null): boolean {
  const el = node instanceof Element ? node : node?.parentElement
  if (el === undefined || el === null) return false
  if (el.closest('[data-notebook-ui]') !== null) return true
  if (el.closest('input, textarea, [contenteditable]') !== null) return true
  return false
}

/**
 * Compute the actionable selection, or null when it should not surface.
 * @param selection - the live selection.
 * @param mouse - mouse-up anchor, if the change came from a mouse gesture.
 */
export function readActiveSelection(selection: Selection | null, mouse?: { x: number; y: number }): ActiveSelection | null {
  if (selection === null || selection.isCollapsed) return null
  const text = selection.toString().trim()
  if (text === '') return null
  const anchorNode = selection.anchorNode
  if (isIgnoredTarget(anchorNode)) return null
  try {
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return null
    return {
      text,
      x: Math.round(rect.right),
      y: Math.round(rect.top),
      ...(mouse === undefined ? {} : { mouseX: Math.round(mouse.x), mouseY: Math.round(mouse.y) }),
    }
  } catch {
    return null
  }
}

/**
 * Observe selection changes and report an actionable selection (or null).
 * Listens to mouseup/keyup (selection gestures) and scroll (reposition).
 * @param onChange - called after each relevant event with the new selection.
 * @returns the disposer removing all listeners.
 */
export function observeSelection(onChange: (sel: ActiveSelection | null) => void): () => void {
  // A mouseup carries the exact cursor position — the best anchor for the
  // floating button. Keyboard/scroll changes fall back to the selection rect.
  let last: ActiveSelection | null = null
  const update = (e?: Event): void => {
    const mouse = e instanceof MouseEvent ? { x: e.clientX, y: e.clientY } : undefined
    const next = readActiveSelection(window.getSelection(), mouse)
    // Non-mouse events after a mouse gesture (scroll/keyup) must not re-anchor
    // the button away from the cursor: while the selected text is unchanged,
    // keep the previous anchor. A genuinely new/extended selection recomputes.
    if (next !== null && mouse === undefined && last !== null && next.text === last.text) {
      onChange(last)
      return
    }
    last = next
    onChange(next)
  }

  document.addEventListener('mouseup', update, true)
  document.addEventListener('keyup', update, true)
  // Reposition on any scroll so the floating button follows the selected text.
  document.addEventListener('scroll', update, true)
  return () => {
    document.removeEventListener('mouseup', update, true)
    document.removeEventListener('keyup', update, true)
    document.removeEventListener('scroll', update, true)
  }
}

/** Clear the current DOM selection (used after add/cancel). */
export function clearActiveSelection(): void {
  const selection = window.getSelection()
  selection?.removeAllRanges()
}
