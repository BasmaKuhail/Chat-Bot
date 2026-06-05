import { getAuthedUser } from "@/lib/api/authedSupabase";

type PersistChatParams = {
  accessToken: string;
  chatId?: string;
  prompt: string;
  reply: string;
};

type PersistChatResult = {
  chatId: string;
};

class ChatPersistenceError extends Error {
  constructor(
    operation: string,
    message: string,
    readonly details?: unknown
  ) {
    super(`${operation}: ${message}`);
    this.name = "ChatPersistenceError";
  }
}

function createChatTitle(prompt: string) {
  const title = prompt.trim().replace(/\s+/g, " ");

  return title.length > 60 ? `${title.slice(0, 57)}...` : title;
}

export async function persistChatMessages({
  accessToken,
  chatId,
  prompt,
  reply,
}: PersistChatParams): Promise<PersistChatResult> {
  let auth;

  try {
    auth = await getAuthedUser(accessToken);
  } catch (error) {
    throw new ChatPersistenceError(
      "get user",
      error instanceof Error ? error.message : "Please log in before sending chat messages.",
      error
    );
  }

  const { supabase, user } = auth;
  const userId = user.id;
  const now = new Date().toISOString();
  let activeChatId = chatId;
  let nextSequenceNumber = 1;

  if (activeChatId) {
    const { data: chat, error } = await supabase
      .from("chats")
      .select("id,user_id,next_sequence_number")
      .eq("id", activeChatId)
      .single();

    if (error || !chat) {
      throw new ChatPersistenceError(
        "load chat",
        error?.message || "Chat could not be found for this user.",
        error
      );
    }

    if (chat.user_id !== userId) {
      throw new ChatPersistenceError(
        "load chat",
        "Chat could not be found for this user."
      );
    }

    nextSequenceNumber =
      typeof chat.next_sequence_number === "number"
        ? chat.next_sequence_number
        : 1;
  } else {
    const { data: chat, error } = await supabase
      .from("chats")
      .insert({
        user_id: userId,
        title: createChatTitle(prompt),
        next_sequence_number: 1,
        created_at: now,
        updated_at: now,
        last_message_at: now,
      })
      .select("id")
      .single();

    if (error || !chat) {
      throw new ChatPersistenceError(
        "create chat",
        error?.message || "Chat could not be created.",
        error
      );
    }

    activeChatId = chat.id;
  }

  const { error: messagesError } = await supabase.from("messages").insert([
    {
      chat_id: activeChatId,
      sequence_number: nextSequenceNumber,
      role: "user",
      content: prompt,
      created_at: now,
    },
    {
      chat_id: activeChatId,
      sequence_number: nextSequenceNumber + 1,
      role: "assistant",
      content: reply,
      created_at: now,
    },
  ]);

  if (messagesError) {
    throw new ChatPersistenceError(
      "insert messages",
      messagesError.message,
      messagesError
    );
  }

  const { error: updateError } = await supabase
    .from("chats")
    .update({
      next_sequence_number: nextSequenceNumber + 2,
      updated_at: now,
      last_message_at: now,
    })
    .eq("id", activeChatId)
    .eq("user_id", userId);

  if (updateError) {
    throw new ChatPersistenceError(
      "update chat",
      updateError.message,
      updateError
    );
  }

  if (!activeChatId) {
    throw new Error("Chat id was not available after saving messages.");
  }

  return { chatId: activeChatId };
}
