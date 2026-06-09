import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { clearAuthCookies, setAuthCookies } from "@/lib/api/authCookies";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export function createAuthedSupabase(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export async function getAuthedUser(accessToken: string) {
  const supabase = createAuthedSupabase(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error("Please log in to continue.");
  }

  return { supabase, user: data.user };
}

export async function getAuthedUserFromRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const accessToken = req.cookies["sb-access-token"];
  const refreshToken = req.cookies["sb-refresh-token"];

  if (accessToken) {
    try {
      return {
        ...(await getAuthedUser(accessToken)),
        accessToken,
        refreshToken,
      };
    } catch {
      // Fall through and renew the session when a refresh token is available.
    }
  }

  if (!refreshToken) {
    clearAuthCookies(res);
    throw new Error("Please log in to continue.");
  }

  const refreshClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { data, error } = await refreshClient.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    clearAuthCookies(res);
    throw new Error("Please log in to continue.");
  }

  setAuthCookies(res, data.session);

  return {
    supabase: createAuthedSupabase(data.session.access_token),
    user: data.user,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}
