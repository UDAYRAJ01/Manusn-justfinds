export function heartbeatSessionFromHeaders(
  cookieHeader: string | undefined,
  authorizationHeader: string | string[] | undefined,
  cookieName: string,
): string {
  const encodedName = `${cookieName}=`;
  const cookieSession = (cookieHeader ?? "")
    .split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(encodedName))
    ?.slice(encodedName.length);

  if (cookieSession) return cookieSession;

  const authorization = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}
