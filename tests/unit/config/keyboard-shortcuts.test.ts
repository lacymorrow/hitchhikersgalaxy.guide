import { describe, expect, it } from "vitest";
import {
  formatShortcut,
  getShortcutDisplay,
  ON_DEMAND_ACTIONS,
  ShortcutAction,
  shortcutConfig,
  shortcutLabel,
} from "@/config/keyboard-shortcuts";

/**
 * Every shortcut a person reads has to come from `shortcutConfig`.
 *
 * The user menus used to print theirs as hand-written text, and six of the
 * eight named the wrong key: ⌘A for mod+shift+A, ⌘S for mod+shift+comma, ⌘B
 * for mod+shift+Y, ⇧⌘Q for mod+shift+X, ⌘L for mod+shift+L, and ⌘D for an
 * action that never existed. The keys worked; the menu lied about them.
 */

describe("formatShortcut", () => {
  it("prints Mac modifiers in the platform's order", () => {
    expect(formatShortcut("mod+shift+,", true)).toBe("⇧⌘,");
    expect(formatShortcut("mod+K", true)).toBe("⌘K");
    expect(formatShortcut("ctrl+alt+shift+mod+P", true)).toBe("⌃⌥⇧⌘P");
  });

  it("spells modifiers out elsewhere, with mod meaning Ctrl", () => {
    expect(formatShortcut("mod+shift+,", false)).toBe("Ctrl+Shift+,");
    expect(formatShortcut("mod+K", false)).toBe("Ctrl+K");
  });

  it("capitalizes a named key and leaves a single character alone", () => {
    expect(formatShortcut("Escape", true)).toBe("Escape");
    expect(formatShortcut("mod+enter", true)).toBe("⌘Enter");
    expect(formatShortcut("/", true)).toBe("/");
  });
});

describe("shortcutLabel", () => {
  it("resolves the keys the user menu shows", () => {
    expect(shortcutLabel(ShortcutAction.GOTO_ADMIN, true)).toBe("⇧⌘A");
    expect(shortcutLabel(ShortcutAction.GOTO_SETTINGS, true)).toBe("⇧⌘S");
    expect(shortcutLabel(ShortcutAction.SET_THEME_LIGHT, true)).toBe("⇧⌘L");
    expect(shortcutLabel(ShortcutAction.SET_THEME_DARK, true)).toBe("⇧⌘D");
    expect(shortcutLabel(ShortcutAction.SET_THEME_SYSTEM, true)).toBe("⇧⌘Y");
    expect(shortcutLabel(ShortcutAction.LOGOUT_USER, true)).toBe("⇧⌘X");
  });

  it("gives every configured action a label on both platforms", () => {
    for (const [, action] of shortcutConfig) {
      expect(shortcutLabel(action, true)).toBeTruthy();
      expect(shortcutLabel(action, false)).toBeTruthy();
    }
  });
});

describe("shortcutConfig", () => {
  it("binds every action in the map to a key", () => {
    for (const action of Object.values(ShortcutAction)) {
      expect(getShortcutDisplay(action)).not.toBeNull();
    }
  });

  it("binds no key twice", () => {
    const keys = shortcutConfig.map(([hotkey]) => hotkey.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
  });

  /**
   * Shift changes what a punctuation key reports. Holding shift and pressing
   * the comma key gives `event.key === "<"`, and Mantine's `isExactHotkey`
   * matches on `event.key`, so `mod+shift+,` never fires -- while
   * `shortcutLabel` still renders a perfectly convincing "⇧⌘,". That
   * combination shipped here and in a downstream fork, and survived a browser
   * test that pressed the literal character instead of the physical key.
   */
  it("never combines shift with a punctuation key", () => {
    for (const [hotkey] of shortcutConfig) {
      const parts = hotkey.split("+").map((part) => part.trim());
      const key = parts[parts.length - 1] ?? "";
      const hasShift = parts.slice(0, -1).some((part) => part.toLowerCase() === "shift");
      if (!hasShift) continue;
      expect(
        key.length > 1 || /^[a-z0-9]$/i.test(key),
        `"${hotkey}" puts shift on "${key}"; shift rewrites event.key for punctuation, so it can never fire`
      ).toBe(true);
    }
  });
});

/**
 * Mantine's `useHotkeys` calls `preventDefault` on every binding unless told
 * otherwise. That is right for a key the app owns outright and wrong for one
 * the browser shares: Escape was bound globally with the default, so every
 * Escape press anywhere was consumed to close a popover that was usually not
 * mounted.
 */
describe("binding options", () => {
  const optionsFor = (hotkey: string) => shortcutConfig.find(([key]) => key === hotkey)?.[2];

  it("does not swallow Escape", () => {
    expect(optionsFor("Escape")?.preventDefault).toBe(false);
  });

  it("exempts the popover from the unhandled-shortcut warning", () => {
    expect(optionsFor("Escape")?.onDemand).toBe(true);
    expect(ON_DEMAND_ACTIONS).toContain(ShortcutAction.CLOSE_POPOVER);
  });

  it("swallows the keys the app owns outright", () => {
    for (const hotkey of ["mod+K", "mod+shift+S", "mod+shift+B"]) {
      expect(optionsFor(hotkey)?.preventDefault ?? true).toBe(true);
    }
  });

  it("keeps every on-demand action bound to a key", () => {
    for (const action of ON_DEMAND_ACTIONS) {
      expect(getShortcutDisplay(action)).not.toBeNull();
    }
  });
});
