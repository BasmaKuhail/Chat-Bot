import type { NextApiRequest, NextApiResponse } from "next";

type LogoutResponse = {
  message: string;
};

function clearCookie(name: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  res.setHeader("Set-Cookie", [
    clearCookie("sb-access-token"),
    clearCookie("sb-refresh-token"),
  ]);

  return res.status(200).json({ message: "Logged out successfully." });
}
