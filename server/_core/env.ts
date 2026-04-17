export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Public app URL (used for tracking pixels, client portal links, etc.)
  appUrl: process.env.APP_URL ?? "https://proposai.org",
  // Owner notification email
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  // LLM — OpenAI-compatible endpoint (can be Anthropic or any third-party provider)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  llmApiUrl: process.env.LLM_API_URL ?? "https://api.anthropic.com/v1/chat/completions",
  llmModel: process.env.LLM_MODEL ?? "claude-sonnet-4-5",
  // Faster/cheaper model for high-volume steps like HTML rendering (defaults to llmModel)
  llmFastModel: process.env.LLM_FAST_MODEL ?? "",
  // Google Maps
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  // Local filesystem storage directory (Railway volume in production).
  // Defaults applied in server/storage.ts.
  storageDir: process.env.STORAGE_DIR ?? "",
};
