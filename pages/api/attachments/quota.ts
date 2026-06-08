import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthedUserFromRequest } from "@/lib/api/authedSupabase";

type QuotaResponse = {
  canUpload?: boolean;
  nextAvailableAt?: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuotaResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  res.setHeader("Cache-Control", "private, no-store");

  if (
    !req.cookies["sb-access-token"] &&
    !req.cookies["sb-refresh-token"]
  ) {
    return res.status(401).json({
      message: "Log in to attach a file.",
    });
  }

  try {
    const { supabase, user } = await getAuthedUserFromRequest(req, res);
    const { data, error } = await supabase
      .from("attachment_daily_credits")
      .select("last_used_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205") {
        return res.status(503).json({
          message:
            "File uploads are not configured yet. Apply the attachment quota database migration.",
        });
      }

      throw new Error(error.message);
    }

    if (!data?.last_used_at) {
      return res.status(200).json({ canUpload: true });
    }

    const nextAvailableAt = new Date(
      new Date(data.last_used_at).getTime() + 24 * 60 * 60 * 1000
    );

    return res.status(200).json({
      canUpload: nextAvailableAt.getTime() <= Date.now(),
      nextAvailableAt: nextAvailableAt.toISOString(),
    });
  } catch (error) {
    console.error("Attachment quota status error:", error);
    return res.status(500).json({
      message: "Attachment credit status could not be loaded.",
    });
  }
}
