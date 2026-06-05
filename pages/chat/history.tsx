import SideNav from "@/components/SideNav";
import { useChat } from "@/context/chatContext";
import { useToast } from "@/context/toastContext";
import type { Message } from "@/types/messages";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const response = await fetch("/api/chats");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Chat history could not be loaded.");
        }

        if (isMounted) {
          setChats(result.chats ?? []);
        }
      } catch (error) {
        showToast({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Chat history could not be loaded.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

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
        <main className="ml-70 flex w-full flex-col gap-6 px-10 py-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-36px font-bold text-blue-20">Chat History</h1>
            <p className="text-sm text-gray-500">
              Open a saved conversation and continue where you left off.
            </p>
          </div>

          {isLoading ? (
            <div className="text-sm text-gray-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="rounded-[8px] border border-gray-200 bg-white-0 p-6 text-sm text-gray-500">
              No saved chats yet.
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-3">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => handleOpenChat(chat.id)}
                  disabled={openingChatId !== null}
                  className="flex cursor-pointer flex-col items-start gap-2 rounded-[8px] border border-gray-200 bg-white-0 p-4 text-left shadow-sm transition hover:border-blue-10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="line-clamp-1 text-base font-semibold text-gray-800">
                    {chat.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {openingChatId === chat.id
                      ? "Opening..."
                      : formatDate(chat.lastMessageAt ?? chat.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
