export interface ReunionUser {
  pseudo: string;
  sub: string;
}

const USER_COOKIE = "wtc-reunion-user";

export function userCookie(user: ReunionUser): string {
  const value = encodeURIComponent(JSON.stringify({ pseudo: user.pseudo, sub: user.sub }));
  return `${USER_COOKIE}=${value}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

export function clearUserCookie(): string {
  return `${USER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function userFromCookie(header: string): ReunionUser | null {
  const raw = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${USER_COOKIE}=`));
  if (!raw) return null;
  try {
    const json = JSON.parse(decodeURIComponent(raw.slice(USER_COOKIE.length + 1))) as Partial<ReunionUser>;
    if (!json.pseudo) return null;
    return { pseudo: json.pseudo, sub: json.sub || "" };
  } catch {
    return null;
  }
}
