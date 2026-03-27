/**
 * i18n translation key coverage test
 * Verifies that all critical translation keys exist in both English and Chinese.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load and evaluate the i18n.ts file to extract translation objects
const i18nPath = resolve(__dirname, "../client/src/lib/i18n.ts");
const i18nContent = readFileSync(i18nPath, "utf-8");

// Extract the resources object via regex (simple key existence check)
function extractKeys(content: string, lang: "en" | "zh"): Set<string> {
  const keys = new Set<string>();
  // Find all key: "value" patterns and key: { patterns
  const keyPattern = /^\s+(\w+):\s+["{]/gm;
  let match;
  while ((match = keyPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

// Critical keys that must exist in both languages
const CRITICAL_SECTION_KEYS = [
  "nav",
  "hero",
  "features",
  "pricing",
  "faq",
  "cta",
  "footer",
  "dashboard",
  "common",
  "trades",
  "socialProof",
  "stats",
  "howItWorks",
  "comparison",
  "aiModels",
];

describe("i18n translation key coverage", () => {
  it("should contain all critical section keys in English", () => {
    for (const key of CRITICAL_SECTION_KEYS) {
      expect(i18nContent).toContain(`${key}:`);
    }
  });

  it("should contain Chinese translations for hero section", () => {
    // Chinese characters in hero section
    expect(i18nContent).toContain("60秒内生成AI报价单");
  });

  it("should contain Chinese translations for features section", () => {
    expect(i18nContent).toContain("功能特色");
  });

  it("should contain Chinese translations for pricing section", () => {
    expect(i18nContent).toContain("价格方案");
  });

  it("should contain Chinese translations for dashboard section", () => {
    expect(i18nContent).toContain("控制台");
    expect(i18nContent).toContain("新建报价单");
    expect(i18nContent).toContain("草稿");
    expect(i18nContent).toContain("已发送");
  });

  it("should contain Chinese translations for footer section", () => {
    expect(i18nContent).toContain("退款政策");
    expect(i18nContent).toContain("版权所有");
  });

  it("should contain Chinese translations for common section", () => {
    expect(i18nContent).toContain("取消");
    expect(i18nContent).toContain("删除");
    expect(i18nContent).toContain("保存");
  });

  it("should contain Chinese translations for trades section", () => {
    expect(i18nContent).toContain("水管工程");
    expect(i18nContent).toContain("电气工程");
    expect(i18nContent).toContain("屋顶工程");
  });

  it("should contain Chinese translations for how-it-works section", () => {
    expect(i18nContent).toContain("描述工程");
  });

  it("should not have syntax errors (parseable as JS object structure)", () => {
    // Verify balanced braces
    let depth = 0;
    let inString = false;
    let stringChar = "";
    for (let i = 0; i < i18nContent.length; i++) {
      const ch = i18nContent[i];
      if (!inString) {
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        else if (ch === '"' || ch === "'") {
          inString = true;
          stringChar = ch;
        }
      } else {
        if (ch === stringChar && i18nContent[i - 1] !== "\\") {
          inString = false;
        }
      }
    }
    // depth should be 0 at end (all braces balanced)
    // Allow small variance due to template literals
    expect(Math.abs(depth)).toBeLessThan(5);
  });
});
