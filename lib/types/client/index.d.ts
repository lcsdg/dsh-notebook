/**
 * Browser-half entry for the dsh-notebook plugin.
 *
 * Mounts one session-header action: a "记事本" button that drops a
 * per-session notepad panel (isolated by sessionId) plus the document-level
 * text-selection observer and its "add to notebook" popup. The note list is
 * read from (and written through) the `notebook` settings namespace via
 * ctx.settingsScope, so it persists per conversation in the host settings
 * document — browser cache clears never touch it.
 *
 * Failure policy: nothing here throws at apply time — an external plugin
 * must never take the GUI down.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type NotebookKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** notebook surface copy. */
        'notebook': NotebookKey;
    }
}
/** Services required by this plugin. */
export declare const inject: string[];
/**
 * Register the notebook header action and wire the input/send ports.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
