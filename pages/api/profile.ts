import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthedUserFromRequest } from "@/lib/api/authedSupabase";
import { setAuthCookies } from "@/lib/api/authCookies";

type Profile = {
  id: string;
  email: string;
  name: string;
};

type ProfileResponse = {
  message?: string;
  profile?: Profile;
};

function getProfileName(metadata: Record<string, unknown>) {
  const candidates = [
    metadata.name,
    metadata.display_name,
    metadata.username,
  ];

  return candidates.find(
    (value): value is string => typeof value === "string" && value.trim() !== ""
  ) ?? "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProfileResponse>
) {
  if (req.method !== "GET" && req.method !== "PATCH") {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { supabase, user, accessToken, refreshToken } =
      await getAuthedUserFromRequest(req, res);

    if (req.method === "GET") {
      return res.status(200).json({
        profile: {
          id: user.id,
          email: user.email ?? "",
          name: getProfileName(user.user_metadata),
        },
      });
    }

    if (typeof req.body !== "object" || req.body === null) {
      return res.status(400).json({ message: "Invalid profile data." });
    }

    const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
    const password =
      typeof req.body.password === "string" ? req.body.password : undefined;
    const confirmPassword =
      typeof req.body.confirmPassword === "string"
        ? req.body.confirmPassword
        : undefined;

    if (name === undefined && password === undefined) {
      return res.status(400).json({ message: "No profile changes were provided." });
    }

    if (name !== undefined && (name.length < 2 || name.length > 50)) {
      return res.status(400).json({
        message: "Name must be between 2 and 50 characters.",
      });
    }

    if (password !== undefined) {
      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters.",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }
    }

    if (!refreshToken) {
      return res.status(401).json({ message: "Please log in to continue." });
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (sessionError || !sessionData.session) {
      return res.status(401).json({
        message: sessionError?.message || "Please log in to continue.",
      });
    }

    setAuthCookies(res, sessionData.session);

    const { data, error } = await supabase.auth.updateUser({
      ...(password !== undefined ? { password } : {}),
      ...(name !== undefined
        ? {
            data: {
              ...user.user_metadata,
              name,
              display_name: name,
            },
          }
        : {}),
    });

    if (error || !data.user) {
      return res.status(400).json({
        message: error?.message || "Profile could not be updated.",
      });
    }

    return res.status(200).json({
      message:
        password !== undefined
          ? "Password updated successfully."
          : "Profile updated successfully.",
      profile: {
        id: data.user.id,
        email: data.user.email ?? "",
        name: getProfileName(data.user.user_metadata),
      },
    });
  } catch (error) {
    return res.status(401).json({
      message:
        error instanceof Error ? error.message : "Please log in to continue.",
    });
  }
}
