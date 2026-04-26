import { Configuration, PostcardsApi } from "@lob/lob-typescript-sdk";

function getApiKey(): string {
  const env = process.env.LOB_ENV ?? "test";
  const key =
    env === "live"
      ? process.env.LOB_API_KEY_LIVE
      : process.env.LOB_API_KEY_TEST;
  if (!key) {
    throw new Error(
      `LOB_API_KEY_${env.toUpperCase()} not set. Add to .env.local.`
    );
  }
  return key;
}

export function getLobConfig(): Configuration {
  return new Configuration({ username: getApiKey() });
}

export function getPostcardsApi(): PostcardsApi {
  return new PostcardsApi(getLobConfig());
}

export function isLobLive(): boolean {
  return (process.env.LOB_ENV ?? "test") === "live";
}
