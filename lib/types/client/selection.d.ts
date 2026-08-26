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
    text: string;
    /** Recomputed right edge of the selection rect (fixed coords). */
    x: number;
    /** Recomputed top edge of the selection rect (fixed coords). */
    y: number;
    /** Mouse anchor (mouseup position), preferred over x/y when present. */
    mouseX?: number;
    mouseY?: number;
}
/** Attribute stamped on this plugin's own UI roots so their selections are ignored. */
export declare const NOTEBOOK_UI_ATTR = "data-notebook-ui";
/**
 * Compute the actionable selection, or null when it should not surface.
 * @param selection - the live selection.
 * @param mouse - mouse-up anchor, if the change came from a mouse gesture.
 */
export declare function readActiveSelection(selection: Selection | null, mouse?: {
    x: number;
    y: number;
}): ActiveSelection | null;
/**
 * Observe selection changes and report an actionable selection (or null).
 * Listens to mouseup/keyup (selection gestures) and scroll (reposition).
 * @param onChange - called after each relevant event with the new selection.
 * @returns the disposer removing all listeners.
 */
export declare function observeSelection(onChange: (sel: ActiveSelection | null) => void): () => void;
/** Clear the current DOM selection (used after add/cancel). */
export declare function clearActiveSelection(): void;
