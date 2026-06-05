import type { NextApiRequest, NextApiResponse } from "next";
import { signInUser } from "@/lib/api/login";
import { isLoginUser, isValidEmail } from "@/lib/validations/register";

type LoginResponse = {
  message: string;
  user?: {
    id: string;
    email: string;
    username?: string;
  };
};

function serializeCookie(name: string, value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${name}=${encodeURIComponent(
    value
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!isLoginUser(req.body)) {
    return res.status(400).json({ message: "Invalid login data." });
  }

  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: "Valid email is required." });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  const { data, error } = await signInUser({ email, password });

  if (error) {
    const isEmailNotConfirmed = error.message
      .toLowerCase()
      .includes("email not confirmed");

    return res.status(isEmailNotConfirmed ? 403 : 401).json({
      message: isEmailNotConfirmed
        ? "Please confirm your email before logging in."
        : error.message || "Invalid email or password.",
    });
  }

  if (!data.user || !data.session) {
    return res.status(401).json({
      message: "Invalid email or password.",
    });
  }

  res.setHeader("Set-Cookie", [
    serializeCookie("sb-access-token", data.session.access_token, data.session.expires_in),
    serializeCookie("sb-refresh-token", data.session.refresh_token, 60 * 60 * 24 * 30),
  ]);

  return res.status(200).json({
    message: "Logged in successfully.",
    user: {
      id: data.user.id,
      email: data.user.email ?? email,
      username:
        typeof data.user.user_metadata.username === "string"
          ? data.user.user_metadata.username
          : undefined,
    },
  });
}
