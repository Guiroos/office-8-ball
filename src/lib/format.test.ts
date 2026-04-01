import { describe, expect, it } from "vitest";

import {
  formatLastPlayedAt,
  formatMatchDate,
  formatTeamType,
  getInitials,
} from "@/lib/format";

describe("formatMatchDate", () => {
  it("formats a date string to pt-BR short datetime", () => {
    const result = formatMatchDate("2024-01-15T14:30:00.000Z");
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("accepts a Date object", () => {
    const result = formatMatchDate(new Date("2024-06-01T10:00:00.000Z"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatLastPlayedAt", () => {
  it("returns fallback when value is null", () => {
    expect(formatLastPlayedAt(null)).toBe("Sem partidas ainda");
  });

  it("formats a valid date string", () => {
    const result = formatLastPlayedAt("2024-03-10T12:00:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("getInitials", () => {
  it("returns initials for a single word", () => {
    expect(getInitials("Carlos")).toBe("C");
  });

  it("returns initials for two words", () => {
    expect(getInitials("Carlos Silva")).toBe("CS");
  });

  it("returns at most 2 characters for many words", () => {
    expect(getInitials("Ana Beatriz Carlos")).toBe("AB");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  João   Pedro  ")).toBe("JP");
  });

  it("uppercases initials", () => {
    expect(getInitials("ana silva")).toBe("AS");
  });
});

describe("formatTeamType", () => {
  it("returns Solo for solo type", () => {
    expect(formatTeamType("solo")).toBe("Solo");
  });

  it("returns Duplas for duo type", () => {
    expect(formatTeamType("duo")).toBe("Duplas");
  });
});
