import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { NotebookInjected } from './NotebookButton.tsx';
import type { NotebookKey } from './locales.ts';
export interface NotebookPanelProps extends NotebookInjected, PropsLocale<'notebook'> {
    sessionId: SessionId;
    /** Close the panel (flushes pending content). */
    onClose: () => void;
}
/**
 * The dropdown panel body. Rendered inside a portal by {@link NotebookButton}.
 */
export declare function NotebookPanel(props: NotebookPanelProps): React.JSX.Element;
/** Re-export so the button can label the key type uniformly. */
export type NotebookPanelLocaleKey = NotebookKey;
