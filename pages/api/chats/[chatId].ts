import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthedUser } from "@/lib/api/authedSupabase";

type LoadedMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sequenceNumber: number;
  createdAt: string;
};

type ChatDetailResponse = {
  chat?: {
    id: string;
    title: string;
    messages: LoadedMessage[];
  };
  message?: string;
};

function getChatId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatDetailResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const accessToken = req.cookies["sb-access-token"];
  const chatId = getChatId(req.query.chatId);

  if (!accessToken) {
    return res.status(401).json({ message: "Please log in to view chat history." });
  }

  if (!chatId) {
    return res.status(400).json({ message: "Chat id is required." });
  }

  try {
    const { supabase, user } = await getAuthedUser(accessToken);
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id,title,user_id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ message: "Chat was not found." });
    }

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id,role,content,sequence_number,created_at")
      .eq("chat_id", chat.id)
      .order("sequence_number", { ascending: true });

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    return res.status(200).json({
      chat: {
        id: chat.id,
        title: chat.title || "Untitled chat",
        messages: (messages ?? []).map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          sequenceNumber: message.sequence_number,
          createdAt: message.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("Chat history detail error:", error);

    return res.status(500).json({
      message: "Chat could not be loaded.",
    });
  }
}
