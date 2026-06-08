import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthedUserFromRequest } from "@/lib/api/authedSupabase";

type ChatSummary = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  updatedAt: string | null;
  hasContentMatch?: boolean;
};

type ChatsResponse = {
  chats?: ChatSummary[];
  message?: string;
};

const MAX_SEARCH_LENGTH = 100;

function getSearchQuery(value: string | string[] | undefined) {
  const query = Array.isArray(value) ? value[0] : value;
  return query?.trim().slice(0, MAX_SEARCH_LENGTH) ?? "";
}

function toChatSummary(chat: {
  id: string;
  title: string | null;
  last_message_at: string | null;
  updated_at: string | null;
}, hasContentMatch = false): ChatSummary {
  return {
    id: chat.id,
    title: chat.title || "Untitled chat",
    lastMessageAt: chat.last_message_at,
    updatedAt: chat.updated_at,
    hasContentMatch,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatsResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (
    !req.cookies["sb-access-token"] &&
    !req.cookies["sb-refresh-token"]
  ) {
    return res.status(401).json({ message: "Please log in to view chat history." });
  }

  let auth;

  try {
    auth = await getAuthedUserFromRequest(req, res);
  } catch {
    return res.status(401).json({ message: "Please log in to view chat history." });
  }

  try {
    const { supabase, user } = auth;
    const searchQuery = getSearchQuery(req.query.q);
    const chatFields = "id,title,last_message_at,updated_at";

    if (!searchQuery) {
      const { data, error } = await supabase
        .from("chats")
        .select(chatFields)
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) {
        throw new Error(error.message);
      }

      return res.status(200).json({
        chats: (data ?? []).map((chat) => toChatSummary(chat)),
      });
    }

    const searchPattern = `%${searchQuery}%`;
    const [
      { data: titleMatches, error: titleError },
      { data: messageMatches, error: messageError },
    ] = await Promise.all([
      supabase
        .from("chats")
        .select(chatFields)
        .eq("user_id", user.id)
        .ilike("title", searchPattern),
      supabase
        .from("messages")
        .select("chat_id,chats!inner(user_id)")
        .eq("chats.user_id", user.id)
        .ilike("content", searchPattern),
    ]);

    if (titleError) {
      throw new Error(titleError.message);
    }

    if (messageError) {
      throw new Error(messageError.message);
    }

    const contentMatchIdSet = new Set(
      (messageMatches ?? [])
        .map((message) => message.chat_id)
        .filter((chatId): chatId is string => typeof chatId === "string")
    );
    const titleMatchIds = new Set((titleMatches ?? []).map((chat) => chat.id));
    const contentMatchIds = [...contentMatchIdSet].filter(
      (chatId) => !titleMatchIds.has(chatId)
    );

    let contentMatches: typeof titleMatches = [];

    if (contentMatchIds.length) {
      const { data, error } = await supabase
        .from("chats")
        .select(chatFields)
        .eq("user_id", user.id)
        .in("id", contentMatchIds);

      if (error) {
        throw new Error(error.message);
      }

      contentMatches = data ?? [];
    }

    const matchingChats = [...(titleMatches ?? []), ...(contentMatches ?? [])];
    matchingChats.sort((first, second) => {
      const firstDate = first.last_message_at ?? first.updated_at;
      const secondDate = second.last_message_at ?? second.updated_at;

      if (!firstDate) {
        return secondDate ? 1 : 0;
      }

      if (!secondDate) {
        return -1;
      }

      return new Date(secondDate).getTime() - new Date(firstDate).getTime();
    });

    return res.status(200).json({
      chats: matchingChats.map((chat) =>
        toChatSummary(chat, contentMatchIdSet.has(chat.id))
      ),
    });
  } catch (error) {
    console.error("Chat history list error:", error);

    return res.status(500).json({
      message: "Chat history could not be loaded.",
    });
  }
}
