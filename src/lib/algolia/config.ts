function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const algoliaConfig = {
  appId: requireEnv("NEXT_PUBLIC_ALGOLIA_APP_ID"),
  apiKey: requireEnv("NEXT_PUBLIC_ALGOLIA_API_KEY"),
  indexName:
    process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? "instant_search",
} as const;
