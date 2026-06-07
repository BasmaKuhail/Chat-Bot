import { useState } from "react";
import Prompt from "./Prompt";
import Response from "./Response";
import TypingIndicator from "./TypingIndicator";
import Input from "../Input";
import { useEffect, useRef } from "react"
import { useChat } from "@/context/chatContext"
import { useToast } from "@/context/toastContext";

type ChatStreamEvent =
    | { type: "delta"; text: string }
    | { type: "done"; chatId?: string; saveError?: string }
    | { type: "error"; message: string };

function getConversationHistory(chat: ReturnType<typeof useChat>["chat"]) {
    const firstPromptIndex = chat.findIndex((message) => message.type === "prompt");

    if (firstPromptIndex === -1) {
        return [];
    }

    return chat
        .slice(firstPromptIndex)
        .filter((message) => !message.text.startsWith("Error:"))
        .slice(-10)
        .map((message) => ({
            role: message.type === "prompt" ? "user" : "assistant",
            content: message.text,
        }));
}

export default function ChatContainer(){
    const {chat, setChat, currentChatId, setCurrentChatId} = useChat();
    const { showToast } = useToast();
    
    const bottomRef = useRef<HTMLDivElement>(null)
    
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chat])

    const [isLoading, setIsLoading] = useState(false);
    const [isStreamingResponse, setIsStreamingResponse] = useState(false);

const handleOnSend = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    setIsLoading(true);
    setIsStreamingResponse(false);
    setChat(prev => [...prev, { type: "prompt", text: userText }]);

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: userText,
                chatId: currentChatId ?? undefined,
                history: getConversationHistory(chat),
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.reply || "Sorry, I encountered an error.");
        }

        if (!res.body) {
            throw new Error("The chat server did not return a response stream.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let responseStarted = false;

        const handleStreamEvent = (event: ChatStreamEvent) => {
            if (event.type === "delta") {
                if (!responseStarted) {
                    responseStarted = true;
                    setIsStreamingResponse(true);
                    setChat((prev) => [
                        ...prev,
                        { type: "response", text: event.text },
                    ]);
                    return;
                }

                setChat((prev) => {
                    const next = [...prev];
                    const lastMessage = next.at(-1);

                    if (lastMessage?.type === "response") {
                        next[next.length - 1] = {
                            ...lastMessage,
                            text: lastMessage.text + event.text,
                        };
                    }

                    return next;
                });
                return;
            }

            if (event.type === "done") {
                setIsStreamingResponse(false);

                if (typeof event.chatId === "string") {
                    setCurrentChatId(event.chatId);
                }

                if (event.saveError) {
                    showToast({ type: "info", message: event.saveError });
                }
                return;
            }

            throw new Error(event.message);
        };

        while (true) {
            const { value, done } = await reader.read();
            buffer += decoder.decode(value, { stream: !done });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                if (line.trim()) {
                    handleStreamEvent(JSON.parse(line) as ChatStreamEvent);
                }
            }

            if (done) {
                if (buffer.trim()) {
                    handleStreamEvent(JSON.parse(buffer) as ChatStreamEvent);
                }
                break;
            }
        }
        
    } catch (error) {
        console.error(error);
        const message =
            error instanceof Error
                ? error.message
                : "Could not reach the chat server.";

        showToast({ type: "error", message });
        setChat((prev) => {
            if (prev.at(-1)?.type === "response") {
                return prev;
            }

            return [
                ...prev,
                { type: "response", text: `Error: ${message}` },
            ];
        });
    } finally {
        setIsLoading(false);
        setIsStreamingResponse(false);
    }
};
    return(
        <div className="flex w-full flex-col gap-6 px-0 pb-40 md:px-10">
            {chat.map((msg, i) => (
                <div key={i}>
                    {msg.type === "prompt" ? (
                        <div className="flex justify-end w-full">
                            <div className="flex w-full max-w-[88%] justify-end md:max-w-[75%]"><Prompt text={msg.text}/></div>
                        </div>
                    ): (
                        <div className="w-full max-w-[820px]">
                            <Response
                                text={msg.text}
                                isStreaming={
                                    isStreamingResponse &&
                                    i === chat.length - 1
                                }
                            />
                        </div>
                    )}
                </div>
            ))}
            {isLoading && !isStreamingResponse && (
                <div className="w-full max-w-[820px]">
                    <TypingIndicator />
                </div>
            )}
            <Input onSend={handleOnSend}/>
            <div ref={bottomRef} />
        </div>
    )
}
