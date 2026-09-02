/**
 * Absolute base URL for server-side fetches back into this app's own routes.
 *
 * Server components can't use relative URLs, and a hardcoded localhost:3000
 * fallback 500s on any deployment that isn't listening on that port — which is
 * every Vercel deployment, and any local `next start -p <other>`.
 *
 * Prefer NEXT_PUBLIC_BASE_URL pointing at the *public alias*. `VERCEL_URL` is
 * the deployment-scoped hostname, which sits behind Vercel's deployment
 * protection: a self-fetch there gets the SSO HTML page back with a 200.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }

  // Set automatically on Vercel (host only, no protocol).
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * GET an internal API route and parse JSON, returning `fallback` on any
 * failure. Checks the content type before parsing: an auth redirect or error
 * page answers 200 with HTML, and calling .json() on that throws a SyntaxError
 * that takes the whole page down with a 500.
 */
export async function fetchInternalJson<T>(path: string, fallback: T): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.error(`internal fetch ${path} failed: HTTP ${response.status}`);
      return fallback;
    }

    if (!response.headers.get("content-type")?.includes("application/json")) {
      console.error(`internal fetch ${path} returned non-JSON — check NEXT_PUBLIC_BASE_URL`);
      return fallback;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Next signals "this route must render dynamically" by throwing during the
    // build's static-render probe. Swallowing that would bake an empty page.
    if (error instanceof Error && (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }

    console.error(`internal fetch ${path} threw:`, error);
    return fallback;
  }
}
