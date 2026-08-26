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
import type { ClientContext, SessionId, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ui-conversation SlotMap merge (conversation.* slots)
// and the settingsScope Context merge (ctx.settingsScope).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { claimNotebookApply, releaseNotebookApply } from './apply-guard.ts'
import { NotebookButton, type NotebookInjected } from './NotebookButton.tsx'
import { createSessionNoteStore } from './note-store.ts'
import { en, zh, type NotebookKey } from './locales.ts'
import type { NotebookSettings } from '../types.ts'

/** Locale namespace this plugin owns. */
const NS = 'notebook'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** notebook surface copy. */
    'notebook': NotebookKey
  }
}

/** Services required by this plugin. */
export const inject = ['slots', 'locale', 'settingsScope', 'conversation', 'sessions']

/**
 * Runtime face of the per-session input shell we need (the shipped
 * SessionInputResolver interface only exposes `for(actx)`; the hub's
 * id-addressed `shell(id)` is what a session-scope-less plugin uses).
 */
interface InputShellFace {
  /** Replace the full draft (machine event; one undo step). */
  setDraft(text: string): void
  /** Published input state (current draft text for append mode). */
  state: { getSnapshot(): { draft: string } }
}

/** Minimal binder face (webUiSettings and settingsScope share this shape). */
interface SettingsBinderFace {
  bind<T>(spec: { namespace: string }): SettingsScope<T>
}

/**
 * Register the notebook header action and wire the input/send ports.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // A duplicated client injection would otherwise mount a second button.
  if (!claimNotebookApply()) return
  ctx.effect(() => releaseNotebookApply, 'notebook: apply claim')

  ctx.effect(() => {
    try {
      return ctx.locale.register(NS, { zh, en })
    } catch {
      return () => {}
    }
  }, 'notebook: dictionaries')

  // Prefer the possibly-newer web settings binder, falling back to the
  // standard settingsScope service.
  const binder = (ctx.get('webUiSettings') ?? ctx.settingsScope) as SettingsBinderFace
  const scope = binder.bind<NotebookSettings>({ namespace: NS })

  /** Place text into one session's composer input (append or replace). */
  const insertIntoInput = (sessionId: SessionId, text: string, mode: 'append' | 'replace'): void => {
    try {
      const hub = ctx.conversation.input as unknown as { shell(id: SessionId): InputShellFace | undefined }
      const shell = hub.shell(sessionId)
      if (shell === undefined) return
      if (mode === 'replace') {
        shell.setDraft(text)
        return
      }
      let current = ''
      try {
        current = shell.state.getSnapshot().draft
      } catch {
        current = ''
      }
      shell.setDraft(current.trim() === '' ? text : `${current}\n${text}`)
    } catch {
      // Never take the GUI down over an input write.
    }
  }

  /** Send text as a queued user prompt in one session (chat-recovery path). */
  const sendPrompt = async (sessionId: SessionId, text: string): Promise<boolean> => {
    try {
      const binding = ctx.sessions.binding(sessionId)
      if (binding === undefined) return false
      const result = await binding.session.prompt([{ type: 'text', text }], 'queue')
      return result.ok
    } catch {
      return false
    }
  }

  /** Per-session inject face: an isolated note store plus the input/send ports. */
  const injected = (sessionId: SessionId): NotebookInjected => ({
    store: createSessionNoteStore(scope, sessionId),
    insertIntoInput: (text, mode) => insertIntoInput(sessionId, text, mode),
    sendPrompt: (text) => sendPrompt(sessionId, text),
  })

  ctx.slots.inject('conversation.session.header.actions', () => {
    try {
      return ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'notebook',
        order: 100,
        locale: NS,
        inject: injected,
      }, NotebookButton)
    } catch {
      return () => {}
    }
  })
}
