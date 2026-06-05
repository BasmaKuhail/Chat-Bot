import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthedUser } from "@/lib/api/authedSupabase";

type ChatSummary = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  updatedAt: string | null;
};

type ChatsResponse = {
  chats?: ChatSummary[];
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatsResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const accessToken = req.cookies["sb-access-token"];

  if (!accessToken) {
    return res.status(401).json({ message: "Please log in to view chat history." });
  }

  try {
    const { supabase, user } = await getAuthedUser(accessToken);
    const { data, error } = await supabase
      .from("chats")
      .select("id,title,last_message_at,updated_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({
      chats: (data ?? []).map((chat) => ({
        id: chat.id,
        title: chat.title || "Untitled chat",
        lastMessageAt: chat.last_message_at,
        updatedAt: chat.updated_at,
      })),
    });
  } catch (error) {
    console.error("Chat history list error:", error);

    return res.status(500).json({
      message: "Chat history could not be loaded.",
    });
  }
}
