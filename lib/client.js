window.__ModuleLoader__.load({
	id: "@max1997/dsh-notebook",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom = require("react-dom");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/apply-guard.ts
		/**
		* Claims the plugin apply slot. Returns true when this call won the slot —
		* a duplicated client injection (module factory executed twice in one page
		* lifetime) must not mount a second header button.
		*/
		function claimNotebookApply() {
			if (globalThis.__dshNotebookApplied === true) return false;
			globalThis.__dshNotebookApplied = true;
			return true;
		}
		/** Releases the claim (fiber cleanup) so a hot-reloaded bundle can claim again. */
		function releaseNotebookApply() {
			globalThis.__dshNotebookApplied = void 0;
		}
		//#endregion
		//#region src/client/selection.ts
		/** Whether a selection is anchored inside a control or this plugin's own UI. */
		function isIgnoredTarget(node) {
			const el = node instanceof Element ? node : node?.parentElement;
			if (el === void 0 || el === null) return false;
			if (el.closest("[data-notebook-ui]") !== null) return true;
			if (el.closest("input, textarea, [contenteditable]") !== null) return true;
			return false;
		}
		/**
		* Compute the actionable selection, or null when it should not surface.
		* @param selection - the live selection.
		* @param mouse - mouse-up anchor, if the change came from a mouse gesture.
		*/
		function readActiveSelection(selection, mouse) {
			if (selection === null || selection.isCollapsed) return null;
			const text = selection.toString().trim();
			if (text === "") return null;
			const anchorNode = selection.anchorNode;
			if (isIgnoredTarget(anchorNode)) return null;
			try {
				const rect = selection.getRangeAt(0).getBoundingClientRect();
				if (rect.width === 0 && rect.height === 0) return null;
				return {
					text,
					x: Math.round(rect.right),
					y: Math.round(rect.top),
					...mouse === void 0 ? {} : {
						mouseX: Math.round(mouse.x),
						mouseY: Math.round(mouse.y)
					}
				};
			} catch {
				return null;
			}
		}
		/**
		* Observe selection changes and report an actionable selection (or null).
		* Listens to mouseup/keyup (selection gestures) and scroll (reposition).
		* @param onChange - called after each relevant event with the new selection.
		* @returns the disposer removing all listeners.
		*/
		function observeSelection(onChange) {
			let last = null;
			const update = (e) => {
				const mouse = e instanceof MouseEvent ? {
					x: e.clientX,
					y: e.clientY
				} : void 0;
				const next = readActiveSelection(window.getSelection(), mouse);
				if (next !== null && mouse === void 0 && last !== null && next.text === last.text) {
					onChange(last);
					return;
				}
				last = next;
				onChange(next);
			};
			document.addEventListener("mouseup", update, true);
			document.addEventListener("keyup", update, true);
			document.addEventListener("scroll", update, true);
			return () => {
				document.removeEventListener("mouseup", update, true);
				document.removeEventListener("keyup", update, true);
				document.removeEventListener("scroll", update, true);
			};
		}
		/** Clear the current DOM selection (used after add/cancel). */
		function clearActiveSelection() {
			window.getSelection()?.removeAllRanges();
		}
		//#endregion
		//#region \0dsh-css:src/client/notebook.module.css.mjs
		const css = ".ZMXGPG_headerButton{height:28px;color:var(--dsw-alias-label-secondary,#a8adb5);cursor:pointer;background:0 0;border:1px solid #0000;border-radius:8px;align-items:center;gap:5px;padding:0 10px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}.ZMXGPG_headerButton:hover,.ZMXGPG_headerButtonOpen{background:var(--dsw-alias-interactive-bg-hover,#ffffff0f);color:var(--dsw-alias-label-primary,#e6e6e6)}.ZMXGPG_buttonIcon{flex:none;width:14px;height:14px}.ZMXGPG_headerLabel{white-space:nowrap}.ZMXGPG_tabButton{height:27px;color:var(--dsw-alias-label-secondary,#a8adb5);cursor:pointer;white-space:nowrap;background:0 0;border:none;align-items:center;gap:5px;padding:0 0 11px;font-size:13px;font-weight:500;line-height:16px;display:inline-flex}.ZMXGPG_tabButton:hover{color:var(--dsw-alias-label-primary,#e6e6e6)}.ZMXGPG_tabButtonOpen{color:var(--dsw-alias-state-business-primary,#4176e6);box-shadow:inset 0 -2px 0 0 var(--dsw-alias-state-business-primary,#4176e6)}.ZMXGPG_panel{z-index:2000;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);background:var(--dsw-specific-input-major,#1c1c1e);width:960px;max-width:calc(100vw - 16px);max-height:min(80vh,760px);box-shadow:var(--dsw-shadow-lv2,0 12px 32px #00000073);border-radius:12px;display:flex;position:fixed;overflow:hidden}.ZMXGPG_split{flex:1;width:100%;min-height:0;display:flex}.ZMXGPG_wrap{flex-direction:column;flex:1;min-width:0;min-height:420px;display:flex}.ZMXGPG_header{border-bottom:1px solid var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);align-items:center;gap:8px;padding:8px 10px 6px;display:flex}.ZMXGPG_panelTitle{color:var(--dsw-alias-label-primary,#e6e6e6);font-size:13px;font-weight:600}.ZMXGPG_closeButton{width:24px;height:24px;color:var(--dsw-alias-label-secondary,#a8adb5);cursor:pointer;background:0 0;border:none;border-radius:6px;place-items:center;font-size:16px;line-height:1;display:inline-grid}.ZMXGPG_closeButton:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0f);color:var(--dsw-alias-label-primary,#e6e6e6)}.ZMXGPG_rail{border-right:1px solid var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);background:var(--dsw-specific-selector,#ffffff05);flex-direction:column;flex:none;width:200px;display:flex}.ZMXGPG_railHeader{justify-content:space-between;align-items:center;padding:8px 10px 6px;display:flex}.ZMXGPG_railTitle{color:var(--dsw-alias-label-primary,#e6e6e6);font-size:13px;font-weight:600}.ZMXGPG_railAddIcon{font-size:15px;line-height:1}.ZMXGPG_iconButton{width:22px;height:22px;color:var(--dsw-alias-label-secondary,#a8adb5);cursor:pointer;background:0 0;border:none;border-radius:6px;place-items:center;font-size:13px;line-height:1;display:inline-grid}.ZMXGPG_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0f);color:var(--dsw-alias-label-primary,#e6e6e6)}.ZMXGPG_iconButton.ZMXGPG_danger:hover{color:var(--dsw-alias-text-danger,#d33)}.ZMXGPG_railList{flex-direction:column;flex:1;gap:1px;padding:2px 6px 8px;display:flex;overflow-y:auto}.ZMXGPG_railRow{border-radius:7px;align-items:center;gap:2px;padding:1px 2px;display:flex}.ZMXGPG_railRow:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0d)}.ZMXGPG_railRowActive{background:var(--dsw-alias-state-business-primary,#2b6cb0);color:#fff}.ZMXGPG_railRowActive .ZMXGPG_railName,.ZMXGPG_railRowActive .ZMXGPG_iconButton{color:#fff}.ZMXGPG_railButton{min-width:0;height:28px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;flex:1;align-items:center;gap:4px;padding:0 4px;display:flex}.ZMXGPG_railName{text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:13px;line-height:20px;overflow:hidden}.ZMXGPG_railInput{border:1px solid var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);background:var(--dsw-specific-input-major,#141416);min-width:0;height:26px;color:var(--dsw-alias-label-primary,#e6e6e6);border-radius:6px;outline:none;flex:1;padding:0 6px;font-size:13px}.ZMXGPG_railActions{flex:none;gap:1px;display:inline-flex}.ZMXGPG_railAddButton{border:1px dashed var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);height:28px;color:var(--dsw-alias-label-secondary,#a8adb5);cursor:pointer;background:0 0;border-radius:7px;justify-content:center;align-items:center;gap:4px;margin:4px 0;font-size:12px;display:inline-flex}.ZMXGPG_railAddButton:hover{color:var(--dsw-alias-label-primary,#e6e6e6);border-color:var(--dsw-alias-interactive-bg-hover-solid,#3a3a3a)}.ZMXGPG_pane{flex-direction:column;flex:1;gap:8px;min-width:0;padding:10px 12px 12px;display:flex}.ZMXGPG_emptyPane{flex-direction:column;flex:1;justify-content:center;align-items:center;gap:10px;padding:20px 16px;display:flex}.ZMXGPG_editorHeader{align-items:center;gap:8px;display:flex}.ZMXGPG_editorTitle{color:var(--dsw-alias-label-primary,#e6e6e6);text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:600;overflow:hidden}.ZMXGPG_saveState{color:var(--dsw-alias-label-tertiary,#6b6f76);margin-left:auto;font-size:11px}.ZMXGPG_saveState[data-state=saving]{color:var(--dsw-alias-state-warn-label,#d9a13c)}.ZMXGPG_clearButton{border:1px solid var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);height:24px;color:var(--dsw-alias-label-secondary,#a8adb5);cursor:pointer;background:0 0;border-radius:6px;align-items:center;padding:0 8px;font-size:12px;line-height:18px;display:inline-flex}.ZMXGPG_clearButton:hover:not(:disabled){color:var(--dsw-alias-text-danger,#d33);border-color:var(--dsw-alias-text-danger,#d33)}.ZMXGPG_clearButton:disabled{opacity:.45;cursor:default}.ZMXGPG_editor{resize:none;border:1px solid var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);background:var(--dsw-specific-input-major,#141416);min-height:280px;color:var(--dsw-alias-label-primary,#e6e6e6);font:13px/20px var(--dsw-font-family,sans-serif);border-radius:8px;outline:none;flex:1;padding:8px 10px}.ZMXGPG_editor:focus{border-color:var(--dsw-alias-state-business-primary,#2b6cb0)}.ZMXGPG_hint{color:var(--dsw-alias-label-secondary,#a8adb5);font-size:12px;line-height:18px}.ZMXGPG_error{color:var(--dsw-alias-text-danger,#d33);font-size:12px}.ZMXGPG_ok{color:var(--dsw-alias-state-business-primary,#2b6cb0);font-size:12px}.ZMXGPG_actions{align-items:center;gap:8px;display:flex}.ZMXGPG_spacer{flex:1}.ZMXGPG_button{border:1px solid var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);height:30px;color:var(--dsw-alias-label-primary,#e6e6e6);cursor:pointer;background:0 0;border-radius:8px;align-items:center;gap:5px;padding:0 12px;font-size:13px;line-height:20px;display:inline-flex}.ZMXGPG_button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#ffffff0f)}.ZMXGPG_button:disabled{opacity:.45;cursor:default}.ZMXGPG_primary{background:var(--dsw-alias-button-info-fill,#2b6cb0);color:#fff;cursor:pointer;border:none;border-radius:8px;align-items:center;gap:5px;height:30px;padding:0 12px;font-size:13px;line-height:20px;display:inline-flex}.ZMXGPG_primary:hover:not(:disabled){background:var(--dsw-alias-button-info-hover,#2f6fb6)}.ZMXGPG_primary:disabled{opacity:.45;cursor:default}.ZMXGPG_dangerPrimary{background:var(--dsw-alias-state-error-primary,#c0392b);color:#fff;cursor:pointer;border:none;border-radius:8px;align-items:center;height:30px;padding:0 12px;font-size:13px;display:inline-flex}.ZMXGPG_modeToggle{color:var(--dsw-alias-label-secondary,#a8adb5);cursor:pointer;align-items:center;gap:5px;font-size:12px;display:inline-flex}.ZMXGPG_overlay{z-index:2000;background:#00000073;justify-content:center;align-items:flex-start;padding-top:12vh;display:flex;position:fixed;inset:0}.ZMXGPG_card{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);background:var(--dsw-specific-input-major,#1c1c1e);min-width:320px;max-width:440px;box-shadow:var(--dsw-shadow-lv2,0 12px 32px #00000073);border-radius:12px;flex-direction:column;gap:10px;padding:14px 16px 16px;display:flex}.ZMXGPG_confirmCard{max-width:380px}.ZMXGPG_title{color:var(--dsw-alias-label-primary,#e6e6e6);margin:0;font-size:14px;font-weight:600}.ZMXGPG_fieldSection{flex-direction:column;gap:6px;display:flex}.ZMXGPG_label{color:var(--dsw-alias-label-secondary,#a8adb5);font-size:12px}.ZMXGPG_noteList{flex-direction:column;gap:2px;max-height:180px;display:flex;overflow-y:auto}.ZMXGPG_noteRow{width:100%;height:30px;color:var(--dsw-alias-label-primary,#e6e6e6);text-align:left;cursor:pointer;background:0 0;border:1px solid #0000;border-radius:7px;align-items:center;padding:0 8px;font-size:13px;display:flex}.ZMXGPG_noteRow:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0f)}.ZMXGPG_noteRowActive{border-color:var(--dsw-alias-state-business-primary,#2b6cb0);background:var(--dsw-alias-state-business-primary,#2b6cb0);color:#fff}.ZMXGPG_noteRowName{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.ZMXGPG_noteRowAdd{border:1px dashed var(--dsw-alias-border-l2-darkmode-thin,#2a2a2a);width:30px;height:30px;color:var(--dsw-alias-label-secondary,#a8adb5);cursor:pointer;background:0 0;border-radius:7px;place-items:center;display:inline-grid}.ZMXGPG_modeRow{gap:14px;display:flex}.ZMXGPG_modeOption{color:var(--dsw-alias-label-primary,#e6e6e6);cursor:pointer;align-items:center;gap:5px;font-size:13px;display:inline-flex}.ZMXGPG_warn{color:var(--dsw-alias-text-danger,#d33);font-size:12px}.ZMXGPG_addButton{z-index:2100;border:1px solid var(--dsw-alias-state-warn-label,#ff9500);background:var(--dsw-specific-input-major,#1c1c1e);height:28px;color:var(--dsw-alias-label-primary,#e6e6e6);box-shadow:var(--dsw-shadow-lv2,0 6px 20px #0006);cursor:pointer;white-space:nowrap;border-radius:8px;align-items:center;gap:5px;padding:0 10px;font-size:13px;line-height:20px;display:inline-flex;position:fixed}.ZMXGPG_addButton:hover{box-shadow:0 0 0 1px #ff950059, var(--dsw-shadow-lv2,0 6px 20px #0006);border-color:#ffb347}.ZMXGPG_addButtonIcon{color:var(--dsw-alias-state-business-primary,#2b6cb0);font-size:13px}";
		const tagId = "@max1997/dsh-notebook/notebook.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@max1997/dsh-notebook";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var notebook_module_css_default = {
			"actions": "ZMXGPG_actions",
			"addButton": "ZMXGPG_addButton",
			"addButtonIcon": "ZMXGPG_addButtonIcon",
			"button": "ZMXGPG_button",
			"buttonIcon": "ZMXGPG_buttonIcon",
			"card": "ZMXGPG_card",
			"clearButton": "ZMXGPG_clearButton",
			"closeButton": "ZMXGPG_closeButton",
			"confirmCard": "ZMXGPG_confirmCard",
			"danger": "ZMXGPG_danger",
			"dangerPrimary": "ZMXGPG_dangerPrimary",
			"editor": "ZMXGPG_editor",
			"editorHeader": "ZMXGPG_editorHeader",
			"editorTitle": "ZMXGPG_editorTitle",
			"emptyPane": "ZMXGPG_emptyPane",
			"error": "ZMXGPG_error",
			"fieldSection": "ZMXGPG_fieldSection",
			"header": "ZMXGPG_header",
			"headerButton": "ZMXGPG_headerButton",
			"headerButtonOpen": "ZMXGPG_headerButtonOpen",
			"headerLabel": "ZMXGPG_headerLabel",
			"hint": "ZMXGPG_hint",
			"iconButton": "ZMXGPG_iconButton",
			"label": "ZMXGPG_label",
			"modeOption": "ZMXGPG_modeOption",
			"modeRow": "ZMXGPG_modeRow",
			"modeToggle": "ZMXGPG_modeToggle",
			"noteList": "ZMXGPG_noteList",
			"noteRow": "ZMXGPG_noteRow",
			"noteRowActive": "ZMXGPG_noteRowActive",
			"noteRowAdd": "ZMXGPG_noteRowAdd",
			"noteRowName": "ZMXGPG_noteRowName",
			"ok": "ZMXGPG_ok",
			"overlay": "ZMXGPG_overlay",
			"pane": "ZMXGPG_pane",
			"panel": "ZMXGPG_panel",
			"panelTitle": "ZMXGPG_panelTitle",
			"primary": "ZMXGPG_primary",
			"rail": "ZMXGPG_rail",
			"railActions": "ZMXGPG_railActions",
			"railAddButton": "ZMXGPG_railAddButton",
			"railAddIcon": "ZMXGPG_railAddIcon",
			"railButton": "ZMXGPG_railButton",
			"railHeader": "ZMXGPG_railHeader",
			"railInput": "ZMXGPG_railInput",
			"railList": "ZMXGPG_railList",
			"railName": "ZMXGPG_railName",
			"railRow": "ZMXGPG_railRow",
			"railRowActive": "ZMXGPG_railRowActive",
			"railTitle": "ZMXGPG_railTitle",
			"saveState": "ZMXGPG_saveState",
			"spacer": "ZMXGPG_spacer",
			"split": "ZMXGPG_split",
			"tabButton": "ZMXGPG_tabButton",
			"tabButtonOpen": "ZMXGPG_tabButtonOpen",
			"title": "ZMXGPG_title",
			"warn": "ZMXGPG_warn",
			"wrap": "ZMXGPG_wrap"
		};
		//#endregion
		//#region src/client/NotebookPanel.tsx
		/**
		* The dropdown panel content: a left rail of this session's notes
		* (add/rename/delete with confirm, active selection, empty state) and a
		* right editing pane for the active note (directly editable, auto-saved with
		* a debounce, flushed on switch/blur/close), plus the send/sync footer.
		*
		* All edits stage in local state and persist through the per-session note
		* store; content writes are debounced by the store and coalesced.
		*/
		const ADD_ICON = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			className: notebook_module_css_default.railAddIcon,
			"aria-hidden": "true",
			children: "＋"
		});
		/** Inline name validation error key ('' = none). */
		function nameError(result, t) {
			if (result.ok) return "";
			if (result.error === "empty") return t("panel.nameEmpty");
			if (result.error === "duplicate") return t("panel.duplicate");
			return "";
		}
		/**
		* The dropdown panel body. Rendered inside a portal by {@link NotebookButton}.
		*/
		function NotebookPanel(props) {
			const { store, insertIntoInput, sendPrompt, t, onClose } = props;
			const [session, setSession] = (0, react.useState)(() => store.getSession());
			const [adding, setAdding] = (0, react.useState)(false);
			const [addDraft, setAddDraft] = (0, react.useState)("");
			const [renamingId, setRenamingId] = (0, react.useState)(null);
			const [renameDraft, setRenameDraft] = (0, react.useState)("");
			const [confirmId, setConfirmId] = (0, react.useState)(null);
			const [confirmClear, setConfirmClear] = (0, react.useState)(false);
			const [formError, setFormError] = (0, react.useState)("");
			/** Live editor draft for the active note. */
			const [content, setContent] = (0, react.useState)("");
			const [sending, setSending] = (0, react.useState)(false);
			const [sendError, setSendError] = (0, react.useState)(null);
			const [sendOk, setSendOk] = (0, react.useState)(false);
			const notes = (0, react.useMemo)(() => session.notes, [session.notes]);
			const activeId = session.activeNoteId;
			const activeNote = notes.find((n) => n.id === activeId) ?? null;
			(0, react.useEffect)(() => store.subscribe(() => setSession(store.getSession())), [store]);
			(0, react.useEffect)(() => {
				setContent(activeNote?.content ?? "");
			}, [activeId]);
			const saveState = activeNote !== null && content !== activeNote.content ? "saving" : "saved";
			const flush = () => store.flushContent();
			const onContentChange = (value) => {
				setContent(value);
				if (activeNote !== null) store.scheduleContentSave(activeNote.id, value);
				setSendError(null);
				setSendOk(false);
			};
			const selectNote = (id) => {
				flush();
				store.setActiveNote(id);
			};
			const beginAdd = () => {
				setAdding(true);
				setAddDraft("");
				setFormError("");
			};
			const commitAdd = () => {
				const result = store.addNote(addDraft);
				if (!result.ok) {
					setFormError(nameError(result, t));
					return;
				}
				setAdding(false);
				setAddDraft("");
				setFormError("");
			};
			const beginRename = (note) => {
				setRenamingId(note.id);
				setRenameDraft(note.name);
				setFormError("");
			};
			const commitRename = () => {
				const id = renamingId;
				setRenamingId(null);
				setFormError("");
				if (id === null) return;
				const result = store.renameNote(id, renameDraft);
				if (!result.ok) setFormError(nameError(result, t));
			};
			const confirmDelete = () => {
				if (confirmId !== null) {
					flush();
					store.removeNote(confirmId);
				}
				setConfirmId(null);
			};
			const confirmClearText = () => {
				if (activeNote !== null) {
					setContent("");
					store.scheduleContentSave(activeNote.id, "");
					store.flushContent();
				}
				setConfirmClear(false);
				setSendError(null);
				setSendOk(false);
			};
			const canSend = activeNote !== null && content !== "" && !sending;
			const handleDirectSend = async () => {
				if (!canSend) return;
				setSending(true);
				setSendError(null);
				setSendOk(false);
				const ok = await sendPrompt(content);
				setSending(false);
				if (ok) {
					setSendOk(true);
					onClose();
				} else setSendError(t("panel.sendFailed", { reason: t("panel.sendFailedReason") }));
			};
			const handleSyncToInput = () => {
				if (!canSend) return;
				insertIntoInput(content, "append");
				setSendOk(true);
				onClose();
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: notebook_module_css_default.wrap,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: notebook_module_css_default.header,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: notebook_module_css_default.panelTitle,
							children: t("panel.title")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: notebook_module_css_default.spacer }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: notebook_module_css_default.closeButton,
							title: t("panel.close"),
							"aria-label": t("panel.close"),
							onClick: onClose,
							children: "×"
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: notebook_module_css_default.split,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: notebook_module_css_default.rail,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: notebook_module_css_default.railHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: notebook_module_css_default.railTitle,
									children: t("panel.title")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: notebook_module_css_default.iconButton,
									onClick: beginAdd,
									title: t("panel.addNote"),
									children: ADD_ICON
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: notebook_module_css_default.railList,
								children: [
									notes.length === 0 && !adding ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: notebook_module_css_default.hint,
										children: t("panel.empty")
									}) : null,
									notes.map((note) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: `${notebook_module_css_default.railRow}${note.id === activeId ? ` ${notebook_module_css_default.railRowActive}` : ""}`,
										children: [renamingId === note.id ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: notebook_module_css_default.railInput,
											value: renameDraft,
											autoFocus: true,
											placeholder: t("panel.noteNamePlaceholder"),
											onChange: (e) => setRenameDraft(e.target.value),
											onBlur: commitRename,
											onKeyDown: (e) => {
												if (e.key === "Enter") commitRename();
												if (e.key === "Escape") setRenamingId(null);
											}
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: notebook_module_css_default.railButton,
											onClick: () => selectNote(note.id),
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: notebook_module_css_default.railName,
												children: note.name || "…"
											})
										}), renamingId !== note.id ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: notebook_module_css_default.railActions,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: notebook_module_css_default.iconButton,
												title: t("panel.rename"),
												onClick: () => beginRename(note),
												children: "✎"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: `${notebook_module_css_default.iconButton} ${notebook_module_css_default.danger}`,
												title: t("panel.remove"),
												onClick: () => setConfirmId(note.id),
												children: "×"
											})]
										}) : null]
									}, note.id)),
									adding ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: notebook_module_css_default.railRow,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: notebook_module_css_default.railInput,
											value: addDraft,
											autoFocus: true,
											placeholder: t("panel.noteNamePlaceholder"),
											onChange: (e) => setAddDraft(e.target.value),
											onKeyDown: (e) => {
												if (e.key === "Enter") commitAdd();
												if (e.key === "Escape") {
													setAdding(false);
													setAddDraft("");
													setFormError("");
												}
											}
										})
									}) : null,
									formError !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: notebook_module_css_default.hint,
										children: formError
									}) : null
								]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: notebook_module_css_default.pane,
							children: activeNote === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: notebook_module_css_default.emptyPane,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: notebook_module_css_default.hint,
									children: t("panel.noNoteSelected")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: notebook_module_css_default.button,
									onClick: beginAdd,
									children: t("panel.addNote")
								})]
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: notebook_module_css_default.editorHeader,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: notebook_module_css_default.saveState,
										"data-state": saveState,
										children: saveState === "saving" ? t("panel.saveState.saving") : t("panel.saveState.saved")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: notebook_module_css_default.clearButton,
										title: t("panel.clearText"),
										disabled: content === "",
										onClick: () => setConfirmClear(true),
										children: t("panel.clearText")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									className: notebook_module_css_default.editor,
									value: content,
									placeholder: t("panel.contentPlaceholder"),
									onChange: (e) => onContentChange(e.target.value),
									onBlur: flush,
									spellCheck: false
								}),
								sendError !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: notebook_module_css_default.error,
									children: sendError
								}) : null,
								sendOk ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: notebook_module_css_default.ok,
									children: t("panel.sendOk")
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: notebook_module_css_default.actions,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: notebook_module_css_default.spacer }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: notebook_module_css_default.button,
											disabled: !canSend,
											onClick: handleSyncToInput,
											children: t("panel.syncToInput")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: notebook_module_css_default.primary,
											disabled: !canSend,
											onClick: () => void handleDirectSend(),
											children: sending ? "…" : t("panel.directSend")
										})
									]
								})
							] })
						}),
						confirmId !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: notebook_module_css_default.overlay,
							onMouseDown: (e) => {
								if (e.target === e.currentTarget) setConfirmId(null);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: `${notebook_module_css_default.card} ${notebook_module_css_default.confirmCard}`,
								role: "alertdialog",
								"aria-modal": "true",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: notebook_module_css_default.title,
										children: t("panel.confirmDeleteTitle")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: notebook_module_css_default.hint,
										children: t("panel.confirmDeleteNote", { name: notes.find((n) => n.id === confirmId)?.name ?? "" })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: notebook_module_css_default.actions,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: notebook_module_css_default.spacer }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: notebook_module_css_default.button,
												onClick: () => setConfirmId(null),
												children: t("panel.cancel")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: notebook_module_css_default.dangerPrimary,
												onClick: confirmDelete,
												children: t("panel.delete")
											})
										]
									})
								]
							})
						}) : null,
						confirmClear ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: notebook_module_css_default.overlay,
							onMouseDown: (e) => {
								if (e.target === e.currentTarget) setConfirmClear(false);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: `${notebook_module_css_default.card} ${notebook_module_css_default.confirmCard}`,
								role: "alertdialog",
								"aria-modal": "true",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: notebook_module_css_default.title,
										children: t("panel.confirmClearTitle")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: notebook_module_css_default.hint,
										children: t("panel.confirmClearNote", { name: activeNote?.name ?? "" })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: notebook_module_css_default.actions,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: notebook_module_css_default.spacer }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: notebook_module_css_default.button,
												onClick: () => setConfirmClear(false),
												children: t("panel.cancel")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: notebook_module_css_default.dangerPrimary,
												onClick: confirmClearText,
												children: t("panel.clear")
											})
										]
									})
								]
							})
						}) : null
					]
				})]
			});
		}
		//#endregion
		//#region src/client/AddToNotebookPopup.tsx
		/**
		* "Add to notebook" popup: choose a target note (create one inline when the
		* session has none) and a write mode (append/overwrite), then commit the
		* selected text immediately to the session's note store.
		*
		* Append inserts a blank line between the existing content and the selection;
		* overwrite replaces it and is flagged as destructive.
		*/
		/** Join the selection onto existing content (append adds a blank line). */
		function joinContent(existing, text, mode) {
			if (mode === "overwrite") return text;
			return existing === "" ? text : `${existing}\n\n${text}`;
		}
		/**
		* The target/mode popup. Rendered inside a portal by {@link NotebookButton}.
		*/
		function AddToNotebookPopup(props) {
			const { store, text, t, onClose, onDone } = props;
			const [selectedId, setSelectedId] = (0, react.useState)(() => store.getSession().activeNoteId);
			const [mode, setMode] = (0, react.useState)(() => store.getSession().appendMode === false ? "overwrite" : "append");
			const [adding, setAdding] = (0, react.useState)(false);
			const [addName, setAddName] = (0, react.useState)("");
			const [formError, setFormError] = (0, react.useState)("");
			const [success, setSuccess] = (0, react.useState)(false);
			const notes = store.getSession().notes;
			const selected = notes.find((n) => n.id === selectedId) ?? null;
			(0, react.useEffect)(() => {
				if (notes.length > 0 && !notes.some((n) => n.id === selectedId)) setSelectedId(notes[0].id);
			}, [notes, selectedId]);
			const selectNote = (id) => {
				setSelectedId(id);
			};
			const commitAdd = (targetId, targetMode) => {
				store.scheduleContentSave(targetId, joinContent(store.getNote(targetId)?.content ?? "", text, targetMode));
				store.flushContent();
				setSuccess(true);
				window.setTimeout(() => onDone(), 700);
			};
			const confirmAdd = () => {
				if (selected !== null) {
					commitAdd(selected.id, mode);
					return;
				}
				if (adding) {
					const result = store.addNote(addName);
					if (!result.ok) {
						setFormError(result.error === "empty" ? t("panel.nameEmpty") : t("panel.duplicate"));
						return;
					}
					setSelectedId(result.note.id);
					commitAdd(result.note.id, mode);
				}
			};
			const canSubmit = selected !== null || adding && addName.trim() !== "";
			const beginCreate = () => {
				setAdding(true);
				setAddName("");
				setFormError("");
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: notebook_module_css_default.overlay,
				"data-notebook-ui": true,
				onMouseDown: (e) => {
					if (e.target === e.currentTarget && !success) onClose();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: `${notebook_module_css_default.card} ${notebook_module_css_default.popupCard}`,
					role: "dialog",
					"aria-modal": "true",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: notebook_module_css_default.title,
						children: t("popup.title")
					}), success ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: notebook_module_css_default.ok,
						children: t("popup.added")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: notebook_module_css_default.fieldSection,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: notebook_module_css_default.label,
									children: t("popup.selectNote")
								}),
								notes.length === 0 && !adding ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: notebook_module_css_default.railAddButton,
									onClick: beginCreate,
									children: t("popup.createNote")
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: notebook_module_css_default.noteList,
									children: [notes.map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: `${notebook_module_css_default.noteRow}${n.id === selectedId ? ` ${notebook_module_css_default.noteRowActive}` : ""}`,
										onClick: () => selectNote(n.id),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: notebook_module_css_default.noteRowName,
											children: n.name || "…"
										})
									}, n.id)), adding ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: notebook_module_css_default.railInput,
										value: addName,
										autoFocus: true,
										placeholder: t("panel.noteNamePlaceholder"),
										onChange: (e) => setAddName(e.target.value),
										onKeyDown: (e) => {
											if (e.key === "Enter") confirmAdd();
										}
									}) : notes.length > 0 && !adding ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: notebook_module_css_default.noteRowAdd,
										onClick: beginCreate,
										children: "＋"
									}) : null]
								}),
								formError !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: notebook_module_css_default.hint,
									children: formError
								}) : null
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: notebook_module_css_default.fieldSection,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: notebook_module_css_default.label,
									children: t("popup.mode")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: notebook_module_css_default.modeRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: notebook_module_css_default.modeOption,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "radio",
											name: "notebook-mode",
											checked: mode === "append",
											onChange: () => {
												setMode("append");
												store.setAppendMode("append");
											}
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("popup.append") })]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: notebook_module_css_default.modeOption,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "radio",
											name: "notebook-mode",
											checked: mode === "overwrite",
											onChange: () => {
												setMode("overwrite");
												store.setAppendMode("replace");
											}
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("popup.overwrite") })]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: mode === "overwrite" ? notebook_module_css_default.warn : notebook_module_css_default.hint,
									children: mode === "overwrite" ? t("popup.overwriteHint") : t("popup.appendHint")
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: notebook_module_css_default.actions,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: notebook_module_css_default.spacer }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: notebook_module_css_default.button,
									onClick: onClose,
									children: t("panel.cancel")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: notebook_module_css_default.primary,
									disabled: !canSubmit,
									onClick: confirmAdd,
									children: t("popup.add")
								})
							]
						})
					] })]
				})
			});
		}
		//#endregion
		//#region src/client/NotebookButton.tsx
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
		const BOOK_ICON = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
			className: notebook_module_css_default.buttonIcon,
			viewBox: "0 0 16 16",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.4",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 2.5h3.5A1.5 1.5 0 0 1 8 4v10a1.5 1.5 0 0 0-1.5-1.5H3z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 2.5H9.5A1.5 1.5 0 0 0 8 4v10a1.5 1.5 0 0 1 1.5-1.5H13z" })]
		});
		/** Clamp a panel's left edge so it stays inside the viewport. */
		function clampLeft(left, width) {
			const max = Math.max(8, window.innerWidth - width - 8);
			return Math.min(Math.max(8, left), max);
		}
		/**
		* Locate the session header's view-tab strip (对话/轨迹/上下文). The tabs
		* row has no slot of its own, so the button is portaled INTO it to sit beside
		* the view tabs. Returns null when the strip is absent (single-tab sessions
		* hide it) — the caller then falls back to its native seat.
		*/
		function findSessionTabRow() {
			for (const header of document.querySelectorAll("header")) {
				const label = header.querySelector("nav[aria-label]")?.getAttribute("aria-label") ?? "";
				if (/会话层级|hierarchy/i.test(label)) return header.querySelector("div[role=\"tablist\"]") ?? null;
			}
			return null;
		}
		/**
		* The header action component. Renders the button (portaled into the session
		* tab strip when one exists); opens/closes the dropdown panel; observes text
		* selection and hosts the floating add button + popup.
		*/
		function NotebookButton(props) {
			const { store, insertIntoInput, sendPrompt, sessionId, t } = props;
			const buttonRef = (0, react.useRef)(null);
			const panelRef = (0, react.useRef)(null);
			const [open, setOpen] = (0, react.useState)(false);
			const [anchor, setAnchor] = (0, react.useState)(null);
			/** Current actionable text selection (floating add button), or null. */
			const [selection, setSelection] = (0, react.useState)(null);
			/** Whether the add-to-notebook popup is open. */
			const [popupOpen, setPopupOpen] = (0, react.useState)(false);
			/** The session tab strip DOM node (button host), or null for the fallback seat. */
			const [tabRow, setTabRow] = (0, react.useState)(null);
			(0, react.useLayoutEffect)(() => {
				const row = findSessionTabRow();
				setTabRow((prev) => prev === row ? prev : row);
			});
			(0, react.useEffect)(() => observeSelection(setSelection), []);
			(0, react.useEffect)(() => {
				const flush = () => store.flushContent();
				window.addEventListener("beforeunload", flush);
				return () => {
					window.removeEventListener("beforeunload", flush);
					store.dispose();
				};
			}, [store]);
			const openPanel = () => {
				const rect = buttonRef.current?.getBoundingClientRect();
				if (rect === void 0) return;
				setAnchor({
					top: Math.round(rect.bottom + 6),
					left: Math.round(rect.left)
				});
				setOpen(true);
			};
			const closePanel = () => {
				store.flushContent();
				setOpen(false);
			};
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPointerDown = (e) => {
					const target = e.target;
					if (panelRef.current?.contains(target) === true) return;
					if (buttonRef.current?.contains(target) === true) return;
					closePanel();
				};
				document.addEventListener("mousedown", onPointerDown);
				return () => document.removeEventListener("mousedown", onPointerDown);
			}, [open, store]);
			const handleAdd = () => {
				if (selection === null) return;
				setPopupOpen(true);
			};
			const finishAdd = () => {
				setPopupOpen(false);
				setSelection(null);
				clearActiveSelection();
			};
			const headerButton = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				ref: buttonRef,
				type: "button",
				"data-notebook-ui": true,
				className: tabRow !== null ? `${notebook_module_css_default.tabButton}${open ? ` ${notebook_module_css_default.tabButtonOpen}` : ""}` : `${notebook_module_css_default.headerButton}${open ? ` ${notebook_module_css_default.headerButtonOpen}` : ""}`,
				title: t("button.manage"),
				"aria-haspopup": "dialog",
				"aria-expanded": open,
				onClick: () => open ? closePanel() : openPanel(),
				children: [BOOK_ICON, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: notebook_module_css_default.headerLabel,
					children: t("button.title")
				})]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				tabRow !== null ? (0, react_dom.createPortal)(headerButton, tabRow) : headerButton,
				open && anchor !== null ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					ref: panelRef,
					className: notebook_module_css_default.panel,
					style: {
						top: anchor.top,
						left: clampLeft(anchor.left, PANEL_WIDTH)
					},
					role: "dialog",
					"aria-modal": "false",
					"data-notebook-ui": true,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NotebookPanel, {
						store,
						insertIntoInput,
						sendPrompt,
						sessionId,
						t,
						onClose: closePanel
					})
				}), document.body) : null,
				!open && selection !== null && !popupOpen ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: notebook_module_css_default.addButton,
					style: {
						left: (selection.mouseX ?? selection.x) + 10,
						top: (selection.mouseY ?? selection.y) + 12
					},
					title: t("addButton.label"),
					onMouseDown: (e) => e.preventDefault(),
					onClick: handleAdd,
					"data-notebook-ui": true,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: notebook_module_css_default.addButtonIcon,
						children: "＋"
					}), t("addButton.label")]
				}), document.body) : null,
				popupOpen && selection !== null ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AddToNotebookPopup, {
					store,
					text: selection.text,
					t,
					onClose: finishAdd,
					onDone: finishAdd
				}), document.body) : null
			] });
		}
		/** Panel width (px) used for viewport clamping. */
		const PANEL_WIDTH = 960;
		//#endregion
		//#region src/types.ts
		/**
		* Normalize any stored section into the current shape, migrating a missing
		* or malformed field to a safe default. Purely derived — nothing is written
		* back until the user edits through the panel.
		* @param raw - the stored (schema-resolved) section value.
		* @returns the normalized shape.
		*/
		function normalizeSettings(raw) {
			const sessions = [];
			for (const entry of raw?.sessions ?? []) {
				const sessionId = typeof entry?.sessionId === "string" ? entry.sessionId : "";
				if (sessionId === "") continue;
				const notes = (entry?.notes ?? []).map((n) => ({
					id: typeof n?.id === "string" ? n.id : "",
					name: typeof n?.name === "string" ? n.name : "",
					content: typeof n?.content === "string" ? n.content : "",
					createdAt: typeof n?.createdAt === "number" ? n.createdAt : Date.now(),
					updatedAt: typeof n?.updatedAt === "number" ? n.updatedAt : Date.now()
				})).filter((n) => n.id !== "");
				const activeNoteId = notes.some((n) => n.id === entry?.activeNoteId) ? entry?.activeNoteId ?? "" : notes.length > 0 ? notes[0].id : "";
				sessions.push({
					sessionId,
					notes,
					activeNoteId,
					appendMode: typeof entry?.appendMode === "boolean" ? entry.appendMode : true
				});
			}
			return { sessions };
		}
		//#endregion
		//#region src/client/note-store.ts
		/** Debounce window for content auto-save (ms). */
		const SAVE_DEBOUNCE_MS = 600;
		function classifyName(name, notes) {
			const trimmed = name.trim();
			if (trimmed === "") return { error: "empty" };
			if (notes.some((n) => n.name === trimmed)) return { error: "duplicate" };
			return {};
		}
		/** Clone a session entry so the reference changes (triggers React re-render). */
		function cloneSession(s) {
			return {
				sessionId: s.sessionId,
				notes: s.notes.map((n) => ({ ...n })),
				activeNoteId: s.activeNoteId
			};
		}
		/**
		* Build the per-session store.
		* @param scope - the bound `notebook` settings scope.
		* @param sessionId - the owning session id.
		*/
		function createSessionNoteStore(scope, sessionId) {
			const listeners = /* @__PURE__ */ new Set();
			/** In-memory mirror; authoritative for reads. Initialized lazily. */
			let memo = null;
			let contentTimer = null;
			let pending = null;
			const notify = () => {
				for (const listener of [...listeners]) try {
					listener();
				} catch {}
			};
			const readScopeSession = () => normalizeSettings(scope.getSnapshot().value).sessions.find((s) => s.sessionId === sessionId);
			const current = () => {
				if (memo === null) memo = readScopeSession() ?? {
					sessionId,
					notes: [],
					activeNoteId: ""
				};
				return memo;
			};
			const findNoteIn = (session, id) => session.notes.find((n) => n.id === id);
			/** Replace the mirror, write it back to settings (this session's entry), notify. */
			const commit = (next) => {
				memo = next;
				const list = normalizeSettings(scope.getSnapshot().value).sessions;
				const index = list.findIndex((s) => s.sessionId === sessionId);
				const out = [...list];
				if (index >= 0) out[index] = next;
				else out.push(next);
				scope.set("sessions", out);
				notify();
			};
			const flushTimer = () => {
				if (contentTimer !== null) {
					clearTimeout(contentTimer);
					contentTimer = null;
				}
			};
			const getSession = () => cloneSession(current());
			const getNote = (id) => current().notes.find((n) => n.id === id);
			const addNote = (rawName) => {
				const session = current();
				const check = classifyName(rawName, session.notes);
				if (check.error !== void 0) return {
					ok: false,
					error: check.error
				};
				const now = Date.now();
				const note = {
					id: crypto.randomUUID(),
					name: rawName.trim(),
					content: "",
					createdAt: now,
					updatedAt: now
				};
				const next = {
					...session,
					notes: [...session.notes, note],
					activeNoteId: note.id
				};
				commit(next);
				return {
					ok: true,
					note
				};
			};
			const renameNote = (id, rawName) => {
				const session = current();
				const note = findNoteIn(session, id);
				if (note === void 0) return {
					ok: false,
					error: "empty"
				};
				const check = classifyName(rawName, session.notes.filter((n) => n.id !== id));
				if (check.error !== void 0) return {
					ok: false,
					error: check.error
				};
				if (note.name === rawName.trim()) return {
					ok: true,
					note
				};
				const renamed = {
					...note,
					name: rawName.trim(),
					updatedAt: Date.now()
				};
				commit({
					...session,
					notes: session.notes.map((n) => n.id === id ? renamed : n)
				});
				return {
					ok: true,
					note: renamed
				};
			};
			const removeNote = (id) => {
				const session = current();
				const remaining = session.notes.filter((n) => n.id !== id);
				if (remaining.length === session.notes.length) return;
				let activeNoteId = session.activeNoteId;
				if (activeNoteId === id) activeNoteId = remaining.length > 0 ? remaining[0].id : "";
				commit({
					...session,
					notes: remaining,
					activeNoteId
				});
			};
			const setActiveNote = (id) => {
				const session = current();
				if (findNoteIn(session, id) === void 0) return;
				if (session.activeNoteId === id) return;
				commit({
					...session,
					activeNoteId: id
				});
			};
			const setAppendMode = (mode) => {
				const session = current();
				const appendMode = mode === "append";
				if (session.appendMode === appendMode) return;
				commit({
					...session,
					appendMode
				});
			};
			const scheduleContentSave = (noteId, content) => {
				pending = {
					noteId,
					content
				};
				flushTimer();
				contentTimer = setTimeout(() => {
					contentTimer = null;
					const job = pending;
					pending = null;
					if (job === null) return;
					const session = current();
					if (findNoteIn(session, job.noteId) === void 0) return;
					commit({
						...session,
						notes: session.notes.map((n) => n.id === job.noteId ? {
							...n,
							content: job.content,
							updatedAt: Date.now()
						} : n)
					});
				}, SAVE_DEBOUNCE_MS);
			};
			const flushContent = () => {
				if (pending === null) return;
				const job = pending;
				pending = null;
				flushTimer();
				const session = current();
				if (findNoteIn(session, job.noteId) === void 0) return;
				commit({
					...session,
					notes: session.notes.map((n) => n.id === job.noteId ? {
						...n,
						content: job.content,
						updatedAt: Date.now()
					} : n)
				});
			};
			const dispose = () => {
				flushTimer();
				pending = null;
				listeners.clear();
			};
			return {
				sessionId,
				getSession,
				getNote,
				addNote,
				renameNote,
				removeNote,
				setActiveNote,
				setAppendMode,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				scheduleContentSave,
				flushContent,
				dispose
			};
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* dsh-notebook UI copy. The zh dictionary is the key source; the en side
		* must carry the exact same key set.
		*/
		const zh = {
			"button.title": "记事本",
			"button.manage": "打开记事本",
			"panel.title": "记事本",
			"panel.close": "关闭记事本",
			"panel.empty": "还没有记事本，点击「新增记事本」开始",
			"panel.noNoteSelected": "请选择或新建一个记事本",
			"panel.saveState.saving": "保存中…",
			"panel.saveState.saved": "已保存",
			"panel.addNote": "新增记事本",
			"panel.noteNamePlaceholder": "记事本名称",
			"panel.rename": "重命名",
			"panel.remove": "删除",
			"panel.active": "当前",
			"panel.contentPlaceholder": "在这里记录你的灵感、AI 回答或文案…",
			"panel.directSend": "直接发送",
			"panel.syncToInput": "发送到输入框",
			"panel.sendOk": "已发送",
			"panel.sendFailed": "发送失败：{reason}",
			"panel.sendFailedReason": "网络或服务异常",
			"panel.readonly": "当前记事本为空，无法发送",
			"panel.confirmDeleteTitle": "删除确认",
			"panel.confirmDeleteNote": "确定删除记事本「{name}」？",
			"panel.clearText": "清空文本",
			"panel.confirmClearTitle": "清空确认",
			"panel.confirmClearNote": "确定清空记事本「{name}」的内容？",
			"panel.clear": "清空",
			"panel.delete": "删除",
			"panel.cancel": "取消",
			"panel.renameHint": "名称不能为空，且不能重复",
			"panel.duplicate": "名称已存在",
			"panel.nameEmpty": "名称不能为空",
			"popup.title": "添加到记事本",
			"popup.selectNote": "选择目标记事本",
			"popup.noNotes": "还没有记事本，请先新建",
			"popup.createNote": "新建记事本",
			"popup.mode": "写入模式",
			"popup.append": "追加",
			"popup.overwrite": "覆盖",
			"popup.appendHint": "把选中文本追加到原内容末尾（自动加空行分隔）",
			"popup.overwriteHint": "用选中文本替换原内容，原内容将丢失",
			"popup.add": "确认添加",
			"popup.added": "已添加到记事本",
			"popup.addFailed": "添加失败：{reason}",
			"addButton.label": "添加到记事本",
			"common.cancel": "取消",
			"common.save": "保存"
		};
		const en = {
			"button.title": "Notebook",
			"button.manage": "Open notebook",
			"panel.title": "Notebook",
			"panel.close": "Close notebook",
			"panel.empty": "No notebooks yet — click \"Add notebook\" to start",
			"panel.noNoteSelected": "Select or create a notebook",
			"panel.saveState.saving": "Saving…",
			"panel.saveState.saved": "Saved",
			"panel.addNote": "Add notebook",
			"panel.noteNamePlaceholder": "Notebook name",
			"panel.rename": "Rename",
			"panel.remove": "Delete",
			"panel.active": "Current",
			"panel.contentPlaceholder": "Jot down your ideas, AI answers or copy…",
			"panel.directSend": "Send directly",
			"panel.syncToInput": "Send to input",
			"panel.sendOk": "Sent",
			"panel.sendFailed": "Send failed: {reason}",
			"panel.sendFailedReason": "network or service error",
			"panel.readonly": "The notebook is empty — nothing to send",
			"panel.confirmDeleteTitle": "Confirm delete",
			"panel.confirmDeleteNote": "Delete notebook \"{name}\"?",
			"panel.clearText": "Clear text",
			"panel.confirmClearTitle": "Confirm clear",
			"panel.confirmClearNote": "Clear the content of notebook \"{name}\"?",
			"panel.clear": "Clear",
			"panel.delete": "Delete",
			"panel.cancel": "Cancel",
			"panel.renameHint": "Name must be non-empty and unique",
			"panel.duplicate": "Name already exists",
			"panel.nameEmpty": "Name must not be empty",
			"popup.title": "Add to notebook",
			"popup.selectNote": "Choose a target notebook",
			"popup.noNotes": "No notebooks yet — create one first",
			"popup.createNote": "Create notebook",
			"popup.mode": "Write mode",
			"popup.append": "Append",
			"popup.overwrite": "Overwrite",
			"popup.appendHint": "Append the selection after the current content (blank line added)",
			"popup.overwriteHint": "Replace the current content with the selection — it will be lost",
			"popup.add": "Add",
			"popup.added": "Added to notebook",
			"popup.addFailed": "Add failed: {reason}",
			"addButton.label": "Add to notebook",
			"common.cancel": "Cancel",
			"common.save": "Save"
		};
		//#endregion
		//#region src/client/index.ts
		/** Locale namespace this plugin owns. */
		const NS = "notebook";
		/** Services required by this plugin. */
		const inject = [
			"slots",
			"locale",
			"settingsScope",
			"conversation",
			"sessions"
		];
		/**
		* Register the notebook header action and wire the input/send ports.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			if (!claimNotebookApply()) return;
			ctx.effect(() => releaseNotebookApply, "notebook: apply claim");
			ctx.effect(() => {
				try {
					return ctx.locale.register(NS, {
						zh,
						en
					});
				} catch {
					return () => {};
				}
			}, "notebook: dictionaries");
			const scope = (ctx.get("webUiSettings") ?? ctx.settingsScope).bind({ namespace: NS });
			/** Place text into one session's composer input (append or replace). */
			const insertIntoInput = (sessionId, text, mode) => {
				try {
					const shell = ctx.conversation.input.shell(sessionId);
					if (shell === void 0) return;
					if (mode === "replace") {
						shell.setDraft(text);
						return;
					}
					let current = "";
					try {
						current = shell.state.getSnapshot().draft;
					} catch {
						current = "";
					}
					shell.setDraft(current.trim() === "" ? text : `${current}\n${text}`);
				} catch {}
			};
			/** Send text as a queued user prompt in one session (chat-recovery path). */
			const sendPrompt = async (sessionId, text) => {
				try {
					const binding = ctx.sessions.binding(sessionId);
					if (binding === void 0) return false;
					return (await binding.session.prompt([{
						type: "text",
						text
					}], "queue")).ok;
				} catch {
					return false;
				}
			};
			/** Per-session inject face: an isolated note store plus the input/send ports. */
			const injected = (sessionId) => ({
				store: createSessionNoteStore(scope, sessionId),
				insertIntoInput: (text, mode) => insertIntoInput(sessionId, text, mode),
				sendPrompt: (text) => sendPrompt(sessionId, text)
			});
			ctx.slots.inject("conversation.session.header.actions", () => {
				try {
					return ctx.slots.register({
						name: "conversation.session.header.actions",
						id: "notebook",
						order: 100,
						locale: NS,
						inject: injected
					}, NotebookButton);
				} catch {
					return () => {};
				}
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map