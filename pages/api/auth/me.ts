import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthedUser } from "@/lib/api/authedSupabase";

type MeResponse = {
  isLoggedIn: boolean;
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MeResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ isLoggedIn: false });
  }

  const accessToken = req.cookies["sb-access-token"];

  if (!accessToken) {
    return res.status(200).json({ isLoggedIn: false });
  }

  try {
    const { user } = await getAuthedUser(accessToken);

    return res.status(200).json({
      isLoggedIn: true,
      user: {
        id: user.id,
        email: user.email,
        username:
          typeof user.user_metadata.username === "string"
            ? user.user_metadata.username
            : undefined,
      },
    });
  } catch {
    return res.status(200).json({ isLoggedIn: false });
  }
}
