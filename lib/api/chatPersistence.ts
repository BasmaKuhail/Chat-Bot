import { createClient } from "@supabase/supabase-js";

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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

function createAuthedSupabase(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
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
  const supabase = createAuthedSupabase(accessToken);
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new ChatPersistenceError(
      "get user",
      userError?.message || "Please log in before sending chat messages.",
      userError
    );
  }

  const userId = userData.user.id;
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
