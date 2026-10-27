import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useCopyToClipboard } from "../../../src/hooks/use-copy-to-clipboard";

describe("useCopyToClipboard", () => {
    // Mock clipboard API
    const mockWriteText = vi.fn(() => Promise.resolve());
    const mockExecCommand = vi.fn(() => true);

    beforeEach(() => {
        vi.useFakeTimers();

        // Stub only the two entry points the hook uses. Replacing `global.document`
        // wholesale leaves React with a container that is not a real DOM node, and
        // every `renderHook` here dies with "Target container is not a DOM element".
        // jsdom already supplies a real document; the fallback path just needs
        // `execCommand`, which jsdom does not implement.
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: mockWriteText },
            configurable: true,
            writable: true,
        });
        Object.defineProperty(document, "execCommand", {
            value: mockExecCommand,
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        // Both stubs are own properties, so deleting them hands the globals back
        // to jsdom untouched.
        Reflect.deleteProperty(navigator, "clipboard");
        Reflect.deleteProperty(document, "execCommand");
    });

    test("should copy text to clipboard and set isCopied to true", async () => {
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard("test text");
        });

        expect(mockWriteText).toHaveBeenCalledWith("test text");
        expect(result.current.isCopied).toBe(true);
    });

    test("should reset isCopied after timeout", async () => {
        const { result } = renderHook(() => useCopyToClipboard({ timeout: 1000 }));

        await act(async () => {
            result.current.copyToClipboard("test text");
        });

        expect(result.current.isCopied).toBe(true);

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.isCopied).toBe(false);
    });

    test("should call onCopy callback when provided", async () => {
        const onCopy = vi.fn();
        const { result } = renderHook(() => useCopyToClipboard({ onCopy }));

        await act(async () => {
            result.current.copyToClipboard("test text");
        });

        expect(onCopy).toHaveBeenCalled();
    });

    test("should not copy empty text", async () => {
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard("");
        });

        expect(mockWriteText).not.toHaveBeenCalled();
        expect(result.current.isCopied).toBe(false);
    });

    test("should handle missing clipboard API gracefully", async () => {
        // Remove clipboard API but keep document.execCommand for fallback
        Object.defineProperty(navigator, "clipboard", {
            value: undefined,
            configurable: true,
            writable: true,
        });

        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard("test text");
        });

        expect(mockExecCommand).toHaveBeenCalledWith("copy");
        expect(result.current.isCopied).toBe(true);
    });
});
