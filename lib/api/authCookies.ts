import type { Session } from "@supabase/supabase-js";
import type { NextApiResponse } from "next";

const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

function serializeCookie(name: string, value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${name}=${encodeURIComponent(
    value
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function setAuthCookies(res: NextApiResponse, session: Session) {
  res.setHeader("Set-Cookie", [
    serializeCookie(
      "sb-access-token",
      session.access_token,
      session.expires_in
    ),
    serializeCookie(
      "sb-refresh-token",
      session.refresh_token,
      REFRESH_TOKEN_MAX_AGE
    ),
  ]);
}

export function clearAuthCookies(res: NextApiResponse) {
  res.setHeader("Set-Cookie", [
    serializeCookie("sb-access-token", "", 0),
    serializeCookie("sb-refresh-token", "", 0),
  ]);
}
