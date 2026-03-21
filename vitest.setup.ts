import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

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
