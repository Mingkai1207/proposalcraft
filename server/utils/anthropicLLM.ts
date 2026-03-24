/**
 * Anthropic Claude API helper
 *
 * Uses the ANTHROPIC_API_KEY environment variable when available.
 * Falls back to the built-in invokeLLM helper when the key is not set.
 *
 * Usage:
 *   const response = await invokeAnthropic({ model: "claude-sonnet-4-5", messages: [...] });
 *   const text = response.content;
 */

import { invokeLLM } from "../_core/llm";

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicOptions {
  /** Anthropic model ID, e.g. "claude-sonnet-4-5" or "claude-3-7-sonnet-20250219" */
  model?: string;
  messages: AnthropicMessage[];
  systemPrompt?: string;
  maxTokens?: number;
}

export interface AnthropicResponse {
  content: string;
  /** true if the Anthropic API was used, false if the built-in LLM fallback was used */
  usedAnthropicApi: boolean;
}

/**
 * Invoke Claude via the Anthropic API, with automatic fallback to the built-in LLM.
 */
export async function invokeAnthropic(opts: AnthropicOptions): Promise<AnthropicResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    // ── Anthropic API path ────────────────────────────────────────────────────
    try {
      const requestBody: Record<string, unknown> = {
        model: opts.model || "claude-sonnet-4-5",
        max_tokens: opts.maxTokens || 8192,
        messages: opts.messages,
      };
      if (opts.systemPrompt) {
        requestBody.system = opts.systemPrompt;
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[Anthropic] API error ${res.status}: ${errBody}`);
        throw new Error(`Anthropic API error: ${res.status}`);
      }

      const data = await res.json() as {
        content: Array<{ type: string; text: string }>;
      };
      const text = data.content?.find((b) => b.type === "text")?.text || "";
      return { content: text, usedAnthropicApi: true };
    } catch (err) {
      console.error("[Anthropic] Request failed, falling back to built-in LLM:", err);
      // Fall through to built-in LLM
    }
  }

  // ── Built-in LLM fallback ─────────────────────────────────────────────────
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (opts.systemPrompt) {
    messages.push({ role: "system", content: opts.systemPrompt });
  }
  for (const m of opts.messages) {
    messages.push({ role: m.role, content: m.content });
  }

  const response = await invokeLLM({ messages });
  const rawContent = response.choices[0]?.message?.content;
  const text = typeof rawContent === "string" ? rawContent : "";
  return { content: text, usedAnthropicApi: false };
}
