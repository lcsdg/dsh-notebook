import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { NoteStore } from './note-store.ts';
import type { NotebookKey } from './locales.ts';
/** Business face supplied by the client entry (see src/client/index.ts). */
export interface NotebookInjected {
    /** Per-session note store (isolated by sessionId). */
    store: NoteStore;
    /** Place `text` into this session's composer input (append or replace). */
    insertIntoInput: (text: string, mode: 'append' | 'replace') => void;
    /** Send `text` as a queued user prompt; resolves to success. */
    sendPrompt: (text: string) => Promise<boolean>;
}
export interface NotebookButtonProps extends NotebookInjected, PropsLocale<'notebook'> {
    /** The current session id (framework standard kit). */
    sessionId: SessionId;
}
/**
 * The header action component. Renders the button (portaled into the session
 * tab strip when one exists); opens/closes the dropdown panel; observes text
 * selection and hosts the floating add button + popup.
 */
export declare function NotebookButton(props: NotebookButtonProps): React.JSX.Element;
/** Re-export so the client entry can name the locale key type. */
export type NotebookButtonLocaleKey = NotebookKey;
