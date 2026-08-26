import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { NoteStore } from './note-store.ts';
export interface AddToNotebookPopupProps extends PropsLocale<'notebook'> {
    /** Per-session note store. */
    store: NoteStore;
    /** The selected text to add. */
    text: string;
    /** Close without adding (or after a successful add). */
    onClose: () => void;
    /** Close after a successful add. */
    onDone: () => void;
}
/**
 * The target/mode popup. Rendered inside a portal by {@link NotebookButton}.
 */
export declare function AddToNotebookPopup(props: AddToNotebookPopupProps): React.JSX.Element;
