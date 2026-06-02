const DEFAULT_URL = "http://127.0.0.1:8080";

export function getEvolutionApiUrl() {
  const raw = process.env.EVOLUTION_API_URL?.trim() || DEFAULT_URL;
  return raw.replace(/\/$/, "").replace("localhost", "127.0.0.1");
}

export async function checkEvolutionApiReachable(): Promise<{
  ok: boolean;
  url: string;
  error?: string;
  hint?: string;
}> {
  const url = getEvolutionApiUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal, method: "GET" });
    clearTimeout(timeout);
    if (response.ok || response.status < 500) {
      return { ok: true, url };
    }
    return {
      ok: false,
      url,
      error: `Evolution API returned HTTP ${response.status}`,
      hint: "Check: docker compose -f docker-compose.evolution.yml logs evolution-api"
    };
  } catch (error) {
    clearTimeout(timeout);
    const msg = error instanceof Error ? error.message : "Connection failed";
    const isRefused =
      /fetch failed|ECONNREFUSED|ENOTFOUND|AbortError|timed out/i.test(msg);
    return {
      ok: false,
      url,
      error: isRefused
        ? "Evolution API is not running on port 8080"
        : msg,
      hint: isRefused
        ? "Start Docker Desktop, then run: docker compose -f docker-compose.evolution.yml up -d"
        : "Verify EVOLUTION_API_URL in .env matches your Evolution API URL"
    };
  }
}
