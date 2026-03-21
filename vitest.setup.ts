import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Sonner calls window.matchMedia in a useEffect; jsdom doesn't implement it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Expose `jest` as a global alias so @testing-library/dom's `jestFakeTimersAreEnabled()`
// detection works correctly with Vitest fake timers. TL/dom checks `typeof jest !== 'undefined'`
// before relying on the `.clock` property that Vitest sets on the faked `setTimeout`.
// Without this, `waitFor` deadlocks when fake timers are active.
(globalThis as unknown as Record<string, unknown>).jest = vi;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
