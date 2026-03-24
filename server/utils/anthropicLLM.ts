/**
 * AI generation helper — VectorEngine API (Claude Sonnet 4.6 Thinking)
 *
 * Uses VECTOR_ENGINE_API_KEY + VECTOR_ENGINE_BASE_URL when available.
 * Falls back to the built-in invokeLLM helper when the key is not set.
 *
 * VectorEngine exposes an OpenAI-compatible /v1/chat/completions endpoint,
 * so we use the standard chat completions format.
 */

import { invokeLLM } from "../_core/llm";

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicOptions {
  /** Model ID — defaults to claude-sonnet-4-6-thinking */
  model?: string;
  messages: AnthropicMessage[];
  systemPrompt?: string;
  maxTokens?: number;
}

export interface AnthropicResponse {
  content: string;
  /** true if the VectorEngine API was used, false if the built-in LLM fallback was used */
  usedAnthropicApi: boolean;
}

const DEFAULT_MODEL = "claude-sonnet-4-6-thinking";

/**
 * Invoke Claude via VectorEngine API, with automatic fallback to the built-in LLM.
 */
export async function invokeAnthropic(opts: AnthropicOptions): Promise<AnthropicResponse> {
  const apiKey = process.env.VECTOR_ENGINE_API_KEY;
  const baseUrl = (process.env.VECTOR_ENGINE_BASE_URL || "https://api.vectorengine.ai").replace(/\/$/, "");

  if (apiKey) {
    // ── VectorEngine API path (OpenAI-compatible) ─────────────────────────────
    try {
      const messages: Array<{ role: string; content: string }> = [];

      if (opts.systemPrompt) {
        messages.push({ role: "system", content: opts.systemPrompt });
      }
      for (const m of opts.messages) {
        messages.push({ role: m.role, content: m.content });
      }

      const requestBody = {
        model: opts.model || DEFAULT_MODEL,
        max_tokens: opts.maxTokens || 16000,
        messages,
      };

      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[VectorEngine] API error ${res.status}: ${errBody}`);
        throw new Error(`VectorEngine API error: ${res.status}`);
      }

      const data = await res.json() as {
        choices: Array<{
          message: { role: string; content: string };
          finish_reason: string;
        }>;
      };

      const text = data.choices?.[0]?.message?.content || "";
      console.log(`[VectorEngine] Used model: ${opts.model || DEFAULT_MODEL}, tokens generated: ${text.length} chars`);
      return { content: text, usedAnthropicApi: true };
    } catch (err) {
      console.error("[VectorEngine] Request failed, falling back to built-in LLM:", err);
      // Fall through to built-in LLM
    }
  }

  // ── Built-in LLM fallback ─────────────────────────────────────────────────
  console.log("[LLM] Using built-in LLM fallback (VECTOR_ENGINE_API_KEY not set)");
  const fallbackMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (opts.systemPrompt) {
    fallbackMessages.push({ role: "system", content: opts.systemPrompt });
  }
  for (const m of opts.messages) {
    fallbackMessages.push({ role: m.role, content: m.content });
  }

  const response = await invokeLLM({ messages: fallbackMessages });
  const rawContent = response.choices[0]?.message?.content;
  const text = typeof rawContent === "string" ? rawContent : "";
  return { content: text, usedAnthropicApi: false };
}
