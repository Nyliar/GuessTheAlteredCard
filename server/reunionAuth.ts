import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { userCookie, type ReunionUser } from "../src/reunionSession";

const TOKEN_URL = "https://auth.altered.re/realms/players/protocol/openid-connect/token";
const USERINFO_URL = "https://auth.altered.re/realms/players/protocol/openid-connect/userinfo";

export function tokenBody(input: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): string {
  return new URLSearchParams({
    grant_type: "authorization_code",
    client_id: input.clientId,
    client_secret: input.clientSecret,
    code: input.code,
    redirect_uri: input.redirectUri,
  }).toString();
}

export function callbackRedirectUri(host: string | undefined): string {
  const name = host?.split(",")[0]?.trim() || "localhost";
  return `http://${name}/auth`;
}

export function loginFailureLocation(message: string): string {
  return `/?auth_error=${encodeURIComponent(message)}`;
}

export async function exchangeLogin(
  input: { clientId: string; clientSecret: string; code: string; redirectUri: string },
  fetchImpl: typeof fetch = fetch,
): Promise<ReunionUser> {
  if (!input.clientSecret) {
    throw new Error("Set REUNION_CLIENT_SECRET in .env and restart the dev server.");
  }
  const tokenResponse = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: tokenBody(input),
  });
  const token = (await tokenResponse.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenResponse.ok || !token.access_token) {
    throw new Error(token.error_description || token.error || "Sign-in failed.");
  }
  const profileResponse = await fetchImpl(USERINFO_URL, {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
  });
  const profile = (await profileResponse.json().catch(() => ({}))) as {
    pseudo?: string;
    preferred_username?: string;
    name?: string;
    sub?: string;
    error?: string;
    error_description?: string;
  };
  if (!profileResponse.ok) {
    throw new Error(profile.error_description || profile.error || "Sign-in failed.");
  }
  const pseudo = profile.pseudo || profile.preferred_username || profile.name;
  if (!pseudo) throw new Error("Re:Union did not return a player name.");
  return { pseudo, sub: profile.sub || "" };
}

export function reunionDevAuth(env: { clientId: string; clientSecret: string }): Plugin {
  return {
    name: "reunion-dev-auth",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (url.pathname !== "/auth") {
          next();
          return;
        }
        void completeAuth(url, req, res, env).catch((error: unknown) => {
          redirect(res, loginFailureLocation(failureMessage(error)));
        });
      });
    },
  };
}

async function completeAuth(
  url: URL,
  req: IncomingMessage,
  res: ServerResponse,
  env: { clientId: string; clientSecret: string },
): Promise<void> {
  const problem = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (problem) {
    redirect(res, loginFailureLocation(problem));
    return;
  }
  const code = url.searchParams.get("code");
  if (!code) {
    redirect(res, loginFailureLocation("Missing authorization code."));
    return;
  }
  const user = await exchangeLogin({
    clientId: env.clientId,
    clientSecret: env.clientSecret,
    code,
    redirectUri: callbackRedirectUri(req.headers.host),
  });
  res.setHeader("Set-Cookie", userCookie(user));
  redirect(res, "/");
}

function failureMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Sign-in failed.";
  const cause = error.cause;
  if (cause instanceof Error && cause.message && cause.message !== error.message) {
    return `${error.message}: ${cause.message}`;
  }
  return error.message;
}

function redirect(res: ServerResponse, location: string): void {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}
