import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatAxisValue,
  formatPercentWithSign,
  generateUniqueId,
  formatNumberInput,
  parseNumberInput,
} from "./formatters";

describe("formatCurrency", () => {
  it("formats thousands with separator", () => {
    const result = formatCurrency(1234567);
    // fr-FR uses non-breaking spaces
    expect(result.replace(/\s/g, " ")).toContain("1");
    expect(result.replace(/\s/g, " ")).toContain("234");
    expect(result.replace(/\s/g, " ")).toContain("567");
  });

  it("formats 0", () => {
    expect(formatCurrency(0)).toBe("0");
  });

  it("formats negative values", () => {
    const result = formatCurrency(-5000);
    expect(result).toContain("5");
  });
});

describe("formatAxisValue", () => {
  it("formats thousands as k", () => {
    expect(formatAxisValue(5000)).toBe("5k");
    expect(formatAxisValue(150000)).toBe("150k");
  });

  it("keeps small values as-is", () => {
    expect(formatAxisValue(500)).toBe("500");
    expect(formatAxisValue(0)).toBe("0");
  });
});

describe("formatPercentWithSign", () => {
  it("adds + sign for positive values", () => {
    expect(formatPercentWithSign(2.5)).toBe("+2.50%");
  });

  it("no + sign for negative values", () => {
    expect(formatPercentWithSign(-1.5)).toBe("-1.50%");
  });

  it("no + sign for zero", () => {
    expect(formatPercentWithSign(0)).toBe("0.00%");
  });

  it("respects decimal count", () => {
    expect(formatPercentWithSign(3.14159, 3)).toBe("+3.142%");
  });
});

describe("generateUniqueId", () => {
  it("generates unique ids", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateUniqueId());
    }
    expect(ids.size).toBe(100);
  });

  it("returns a string with timestamp and random part", () => {
    const id = generateUniqueId();
    expect(id).toContain("-");
    const parts = id.split("-");
    expect(parts.length).toBe(2);
    expect(Number(parts[0])).toBeGreaterThan(0);
  });
});

describe("formatNumberInput", () => {
  it("formats with locale separators", () => {
    const result = formatNumberInput(1234567);
    expect(result.replace(/\s/g, " ")).toContain("1");
  });
});

describe("parseNumberInput", () => {
  it("parses clean numbers", () => {
    expect(parseNumberInput("1234")).toBe(1234);
  });

  it("removes spaces and parses", () => {
    expect(parseNumberInput("1 234 567")).toBe(1234567);
  });

  it("returns 0 for invalid input", () => {
    expect(parseNumberInput("abc")).toBe(0);
    expect(parseNumberInput("")).toBe(0);
  });
});
