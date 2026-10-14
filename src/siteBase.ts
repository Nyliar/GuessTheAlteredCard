export function siteBase(value: string | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw || raw === "/") return "/";
  const withLead = raw.startsWith("/") ? raw : `/${raw}`;
  return withLead.endsWith("/") ? withLead : `${withLead}/`;
}
