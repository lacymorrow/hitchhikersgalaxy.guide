/**
 * Every global keyboard shortcut, and nothing else.
 *
 * This list is a promise. `KeyboardShortcutProvider` binds each entry through
 * Mantine's `useHotkeys` and fans the press out to whatever registered
 * `useKeyboardShortcut` for that action -- so an entry with no handler binds
 * the key, swallows the press and does nothing, silently, with no build, lint
 * or test failure anywhere. An action belongs here only once something
 * handles it; in development the provider warns about the ones nothing
 * claimed.
 *
 * That matters most downstream. Removing a component is the normal thing to
 * do to a boilerplate, and removing the component that handled a shortcut
 * leaves the key bound and the config still advertising it. Keepsake, a fork
 * that dropped the command menu, the user menu and the popover, ran for
 * months with ten of these eleven dead and no way to tell.
 *
 * Anything that shows a shortcut to a person -- a menu row, a tooltip, a
 * `<kbd>` -- must read it from here through `shortcutLabel`, never as a
 * hand-written string. The user menus printed eight hints as text and six of
 * them named the wrong key: ⌘A for what is bound to mod+shift+A, ⌘S for
 * mod+shift+comma, ⌘B for mod+shift+Y, ⇧⌘Q for mod+shift+X, ⌘L for
 * mod+shift+L, and ⌘D for an action that does not exist.
 */
export const ShortcutAction = {
  OPEN_SEARCH: "open-search",
  TOGGLE_SIDEBAR: "toggle-sidebar",
  LOGOUT_USER: "logout-user",
  CLOSE_POPOVER: "close-popover",
  SET_THEME_LIGHT: "set-theme-light",
  SET_THEME_DARK: "set-theme-dark",
  SET_THEME_SYSTEM: "set-theme-system",
  GOTO_ADMIN: "goto-admin",
  GOTO_SETTINGS: "goto-settings",
} as const;

export type ShortcutActionType = (typeof ShortcutAction)[keyof typeof ShortcutAction];

/**
 * Maps keyboard shortcuts (using Mantine's HotkeyItem format) to actions.
 * @see https://mantine.dev/hooks/use-hotkeys/
 *
 * Mantine ignores hotkeys raised from an INPUT, TEXTAREA or SELECT, so none
 * of these fire while someone is typing. That is the right behaviour and is
 * worth knowing before you file "mod+K does nothing" as a bug.
 */
export const shortcutConfig: readonly (readonly [string, ShortcutActionType])[] = [
  // Universal search - works with whatever search component is visible
  ["mod+K", ShortcutAction.OPEN_SEARCH],
  ["/", ShortcutAction.OPEN_SEARCH],

  // App Actions
  ["mod+shift+X", ShortcutAction.LOGOUT_USER],
  ["mod+shift+B", ShortcutAction.TOGGLE_SIDEBAR],
  ["Escape", ShortcutAction.CLOSE_POPOVER],

  // Theme
  ["mod+shift+L", ShortcutAction.SET_THEME_LIGHT],
  ["mod+shift+D", ShortcutAction.SET_THEME_DARK],
  ["mod+shift+Y", ShortcutAction.SET_THEME_SYSTEM],

  // Navigation
  ["mod+shift+A", ShortcutAction.GOTO_ADMIN],
  ["mod+shift+,", ShortcutAction.GOTO_SETTINGS],
];

/** The raw hotkey bound to an action, or null when the action has no key. */
export function getShortcutDisplay(action: ShortcutActionType): string | null {
  const shortcut = shortcutConfig.find(([, act]) => act === action);
  return shortcut ? shortcut[0] : null;
}

/**
 * A hotkey as a person reads it: "mod+shift+," becomes "⇧⌘," on a Mac and
 * "Ctrl+Shift+," everywhere else.
 *
 * Mac order is the platform's, modifiers ascending: ⌃ ⌥ ⇧ ⌘.
 */
export function formatShortcut(hotkey: string, isMac: boolean): string {
  const parts = hotkey.split("+").map((part) => part.trim().toLowerCase());
  const key = parts[parts.length - 1] ?? "";
  const has = (name: string) => parts.slice(0, -1).includes(name);
  const printedKey = key.length === 1 ? key.toUpperCase() : capitalize(key);

  if (isMac) {
    return (
      (has("ctrl") ? "⌃" : "") +
      (has("alt") ? "⌥" : "") +
      (has("shift") ? "⇧" : "") +
      (has("mod") || has("meta") ? "⌘" : "") +
      printedKey
    );
  }
  const names = [
    has("mod") || has("ctrl") ? "Ctrl" : null,
    has("alt") ? "Alt" : null,
    has("shift") ? "Shift" : null,
    has("meta") ? "Win" : null,
  ].filter((name): name is string => name !== null);
  return [...names, printedKey].join("+");
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]?.toUpperCase() + value.slice(1);
}

/**
 * The display form of an action's key, or null when it has no key.
 *
 * This is the only way a shortcut should reach a person's eyes. A row that
 * prints its own key drifts from the binding, or outlives it entirely.
 */
export function shortcutLabel(action: ShortcutActionType, isMac: boolean): string | null {
  const hotkey = getShortcutDisplay(action);
  return hotkey === null ? null : formatShortcut(hotkey, isMac);
}
