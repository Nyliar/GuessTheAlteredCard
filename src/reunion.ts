import { clearUserCookie, userFromCookie, type ReunionUser } from "./reunionSession";

const AUTHORIZE = "https://auth.altered.re/realms/players/protocol/openid-connect/auth";
const SCOPES = "openid profile";

export const REUNION_CLIENT_ID = import.meta.env.VITE_REUNION_CLIENT_ID || "whos-that-character";

export type { ReunionUser } from "./reunionSession";
export { clearUserCookie, userCookie, userFromCookie } from "./reunionSession";

export function redirectUri(): string {
  return `${window.location.origin}/auth`;
}

export function authorizeQuery(input: { clientId: string; redirectUri: string }): string {
  return new URLSearchParams({
    client_id: input.clientId,
    response_type: "code",
    scope: SCOPES,
    redirect_uri: input.redirectUri,
  }).toString();
}

export function startLogin(): void {
  const query = authorizeQuery({
    clientId: REUNION_CLIENT_ID,
    redirectUri: redirectUri(),
  });
  window.location.assign(`${AUTHORIZE}?${query}`);
}

export function loadUser(): ReunionUser | null {
  return userFromCookie(document.cookie);
}

export function loginError(search: string): string | null {
  return new URLSearchParams(search).get("auth_error");
}

export function disconnect(): void {
  document.cookie = clearUserCookie();
  localStorage.removeItem("wtc-reunion");
}
