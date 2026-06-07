import type { NextApiRequest, NextApiResponse } from "next";
import { clearAuthCookies } from "@/lib/api/authCookies";

type LogoutResponse = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  clearAuthCookies(res);

  return res.status(200).json({ message: "Logged out successfully." });
}
