/**
 * VectorEngine API integration test
 * Validates that VECTOR_ENGINE_API_KEY and VECTOR_ENGINE_BASE_URL are set
 * and that the API returns a valid response.
 */

import { describe, it, expect } from "vitest";

describe("VectorEngine API", () => {
  it("should have VECTOR_ENGINE_API_KEY set", () => {
    expect(process.env.VECTOR_ENGINE_API_KEY).toBeTruthy();
    expect(process.env.VECTOR_ENGINE_API_KEY).not.toBe("");
  });

  it("should have VECTOR_ENGINE_BASE_URL set", () => {
    expect(process.env.VECTOR_ENGINE_BASE_URL).toBeTruthy();
  });

  it("should return a valid response from the API", async () => {
    const apiKey = process.env.VECTOR_ENGINE_API_KEY;
    const baseUrl = (process.env.VECTOR_ENGINE_BASE_URL || "https://api.vectorengine.ai").replace(/\/$/, "");

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6-thinking",
        max_tokens: 20,
        messages: [{ role: "user", content: "Reply with just the word: OK" }],
      }),
    });

    expect(res.ok).toBe(true);
    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    expect(data.choices).toBeDefined();
    expect(data.choices.length).toBeGreaterThan(0);
    expect(typeof data.choices[0].message.content).toBe("string");
    expect(data.choices[0].message.content.length).toBeGreaterThan(0);
  }, 30000);
});
