/** Zustand persist keys used by the app */
const PERSIST_KEYS = [
  "playbook-editor-playbooks",
  "playbook-editor-alert-history",
  "playbook-editor-audit",
  "playbook-editor-feedback",
  "playbook-editor-tag-activation",
  "signal-relay-auth",
  "signal-relay-settings",
  "signal-relay-reports",
  "signal-relay-margin-decisions",
  "signal-relay-purchased-playbooks",
  "signal-relay-inventory-items",
] as const;

/** Wipe persisted client state (localStorage) */
export function clearPersistedAppStorage(): void {
  if (typeof localStorage === "undefined") return;

  for (const key of PERSIST_KEYS) {
    localStorage.removeItem(key);
  }

  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith("signal-relay-pw-") || key.startsWith("playbook-editor-"))
    ) {
      toRemove.push(key);
    }
  }
  for (const key of toRemove) {
    localStorage.removeItem(key);
  }
}
