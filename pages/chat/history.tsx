import SideNav from "@/components/SideNav";
import { useChat } from "@/context/chatContext";
import { useToast } from "@/context/toastContext";
import type { Message } from "@/types/messages";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

type ChatSummary = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  updatedAt: string | null;
};

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "No messages yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRelativeDate(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  const date = new Date(value);
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffInMinutes < 1) {
    return "Just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return formatDate(value);
}

function toUiMessages(messages: ChatHistoryMessage[]): Message[] {
  return messages.map((message) => ({
    type: message.role === "user" ? "prompt" : "response",
    text: message.content,
  }));
}

export default function ChatHistoryPage() {
  const router = useRouter();
  const { loadChat } = useChat();
  const { showToast } = useToast();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/chats");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Chat history could not be loaded.");
      }

      setChats(result.chats ?? []);
    } catch (error) {
      showToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Chat history could not be loaded.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleOpenChat = async (chatId: string) => {
    setOpeningChatId(chatId);

    try {
      const response = await fetch(`/api/chats/${chatId}`);
      const result = await response.json();

      if (!response.ok || !result.chat) {
        throw new Error(result.message || "Chat could not be loaded.");
      }

      loadChat(chatId, toUiMessages(result.chat.messages ?? []));
      router.push("/");
    } catch (error) {
      showToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Chat could not be loaded.",
      });
    } finally {
      setOpeningChatId(null);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-white-10">
      <div className="flex flex-row">
        <SideNav />
        <main className="flex w-full flex-col gap-6 px-4 py-20 md:ml-80 md:px-10 md:py-10">
          <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-blue-20 md:text-36px">
                Chat History
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-gray-500">
                Open a saved conversation and continue where you left off.
              </p>
              <span className="text-xs font-semibold uppercase text-gray-400">
                {isLoading
                  ? "Loading"
                  : `${chats.length} saved ${chats.length === 1 ? "chat" : "chats"}`}
              </span>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              disabled={isLoading}
              className="w-full cursor-pointer rounded-[8px] border border-gray-200 bg-white-0 px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-blue-10 hover:text-blue-10 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {isLoading ? (
            <div className="grid w-full grid-cols-1 gap-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="rounded-[8px] border border-gray-200 bg-white-0 p-5 shadow-sm"
                >
                  <div className="mb-3 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-gray-300 bg-white-0 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-10">
                +
              </div>
              <h2 className="text-lg font-bold text-gray-800">No saved chats yet</h2>
              <p className="max-w-md text-sm leading-6 text-gray-500">
                Start a new conversation and your messages will appear here automatically.
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-2 cursor-pointer rounded-[8px] bg-blue-10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Start Chatting
              </button>
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-3">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => handleOpenChat(chat.id)}
                  disabled={openingChatId !== null}
                  className="group flex cursor-pointer flex-col gap-4 rounded-[8px] border border-gray-200 bg-white-0 p-5 text-left shadow-sm transition hover:border-blue-10 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="line-clamp-1 text-base font-bold text-gray-800 group-hover:text-blue-20">
                      {chat.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(chat.lastMessageAt ?? chat.updatedAt)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                      {openingChatId === chat.id
                        ? "Opening..."
                        : formatRelativeDate(chat.lastMessageAt ?? chat.updatedAt)}
                    </span>
                    <span className="text-sm font-semibold text-blue-10">
                      Open
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
