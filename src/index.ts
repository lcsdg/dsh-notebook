/**
 * Host loader entry for the dsh-notebook plugin — runs in the DSH host
 * process. Registers the `notebook` settings namespace (schemastery schema +
 * an empty composition base layer) through the official settings service, so
 * per-session notepads survive browser cache clears and live in the user's
 * settings document. The browser half (src/client) renders the header button
 * and its dropdown panel and edits this namespace.
 */
import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from 'schemastery'
import { NOTEBOOK_NAMESPACE, type NotebookSettings } from './types.ts'

/** Stable cordis plugin row name (matches cordis.patch.yml). */
export const name = 'notebook'

/**
 * Settings namespace of the notebook capability. Spelled here rather than
 * imported so the browser half can spell the same value without depending on
 * a Host package.
 */
export const NOTEBOOK_SETTINGS_NAMESPACE = settingsNamespace(NOTEBOOK_NAMESPACE)

/**
 * Schema for the settings section (validated against the stored document).
 * One array of per-session notepads; each session's notes start empty and are
 * appended lazily on first use.
 */
export const Config: z<NotebookSettings> = z.object({
  sessions: z.array(z.object({
    sessionId: z.string(),
    notes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      content: z.string(),
      createdAt: z.number(),
      updatedAt: z.number(),
    })).default([]),
    activeNoteId: z.string().default(''),
    appendMode: z.boolean().default(true),
  })).default([]),
})

/** Start with no notepads; new sessions are created lazily in the browser. */
export const DEFAULT_SETTINGS: NotebookSettings = {
  sessions: [],
}

/**
 * Apply the host half: register the settings section. Nothing on the host
 * side reacts to note edits — the browser panel reads/writes the namespace
 * through the settings scope.
 * @param ctx - host plugin context.
 */
export function apply(ctx: Context): void {
  installSettingsSection(ctx, NOTEBOOK_SETTINGS_NAMESPACE, Config, DEFAULT_SETTINGS, {
    setSource: () => {},
    onChange: () => {},
  })
}
