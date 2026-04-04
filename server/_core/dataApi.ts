/**
 * Quick example (matches curl usage):
 *   await callDataApi("Youtube/search", {
 *     query: { gl: "US", hl: "en", q: "manus" },
 *   })
 */

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  _apiId: string,
  _options: DataApiCallOptions = {}
): Promise<unknown> {
  // callDataApi was previously a Manus-specific proxy. Replace with direct API calls
  // to whichever external service you need (YouTube, etc.) using their own API keys.
  throw new Error(
    "callDataApi is not available outside Manus. Make direct API calls to external services instead."
  );
}
