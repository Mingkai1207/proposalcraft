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
  // LLM — direct Anthropic API (OpenAI-compatible endpoint)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Google Maps
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  // AWS S3 for file storage
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
  awsBucket: process.env.AWS_S3_BUCKET ?? "",
};
