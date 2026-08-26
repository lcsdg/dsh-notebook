/**
 * Claims the plugin apply slot. Returns true when this call won the slot —
 * a duplicated client injection (module factory executed twice in one page
 * lifetime) must not mount a second header button.
 */
export function claimNotebookApply(): boolean {
  if ((globalThis as { __dshNotebookApplied?: boolean }).__dshNotebookApplied === true) return false
  ;(globalThis as { __dshNotebookApplied?: boolean }).__dshNotebookApplied = true
  return true
}

/** Releases the claim (fiber cleanup) so a hot-reloaded bundle can claim again. */
export function releaseNotebookApply(): void {
  ;(globalThis as { __dshNotebookApplied?: boolean }).__dshNotebookApplied = undefined
}
