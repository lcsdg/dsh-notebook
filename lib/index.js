import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "schemastery";
//#region src/types.ts
/** Stable settings namespace (spelled identically in the host entry). */
const NOTEBOOK_NAMESPACE = "notebook";
//#endregion
//#region src/index.ts
/** Stable cordis plugin row name (matches cordis.patch.yml). */
const name = "notebook";
/**
* Settings namespace of the notebook capability. Spelled here rather than
* imported so the browser half can spell the same value without depending on
* a Host package.
*/
const NOTEBOOK_SETTINGS_NAMESPACE = settingsNamespace(NOTEBOOK_NAMESPACE);
/**
* Schema for the settings section (validated against the stored document).
* One array of per-session notepads; each session's notes start empty and are
* appended lazily on first use.
*/
const Config = z.object({ sessions: z.array(z.object({
	sessionId: z.string(),
	notes: z.array(z.object({
		id: z.string(),
		name: z.string(),
		content: z.string(),
		createdAt: z.number(),
		updatedAt: z.number()
	})).default([]),
	activeNoteId: z.string().default(""),
	appendMode: z.boolean().default(true)
})).default([]) });
/** Start with no notepads; new sessions are created lazily in the browser. */
const DEFAULT_SETTINGS = { sessions: [] };
/**
* Apply the host half: register the settings section. Nothing on the host
* side reacts to note edits — the browser panel reads/writes the namespace
* through the settings scope.
* @param ctx - host plugin context.
*/
function apply(ctx) {
	installSettingsSection(ctx, NOTEBOOK_SETTINGS_NAMESPACE, Config, DEFAULT_SETTINGS, {
		setSource: () => {},
		onChange: () => {}
	});
}
//#endregion
export { Config, DEFAULT_SETTINGS, NOTEBOOK_SETTINGS_NAMESPACE, apply, name };
