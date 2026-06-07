import { useState } from "react";
import Prompt from "./Prompt";
import Response from "./Response";
import TypingIndicator from "./TypingIndicator";
import Input from "../Input";
import { useEffect, useRef } from "react"
import { useChat } from "@/context/chatContext"
import { useToast } from "@/context/toastContext";
import type { Message, ResponseMessage } from "@/types/messages";
import ExportChat from "./ExportChat";

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

function getResponseVersions(message: ResponseMessage) {
    return message.versions?.length ? message.versions : [message.text];
}

export default function ChatContainer(){
    const {chat, setChat, currentChatId, setCurrentChatId} = useChat();
    const { showToast } = useToast();
    
    const bottomRef = useRef<HTMLDivElement>(null)
    const activeRequestRef = useRef<AbortController | null>(null);
    
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chat])

    const [isLoading, setIsLoading] = useState(false);
    const [streamingResponseIndex, setStreamingResponseIndex] = useState<number | null>(null);

    const updateResponseVersion = (
        responseIndex: number,
        updater: (current: string) => string
    ) => {
        setChat((currentChat) => {
            const next = [...currentChat];
            const response = next[responseIndex];

            if (response?.type !== "response") {
                return currentChat;
            }

            const versions = [...getResponseVersions(response)];
            const activeVersion = response.activeVersion ?? versions.length - 1;
            versions[activeVersion] = updater(versions[activeVersion] ?? "");
            next[responseIndex] = {
                ...response,
                text: versions[activeVersion],
                versions,
                activeVersion,
            };

            return next;
        });
    };

    const generateResponse = async ({
        prompt,
        displayChat,
        contextChat,
        responseIndex,
        savePrompt,
    }: {
        prompt: string;
        displayChat: Message[];
        contextChat: Message[];
        responseIndex?: number;
        savePrompt: boolean;
    }) => {
        if (isLoading) return;

        setIsLoading(true);
        const abortController = new AbortController();
        activeRequestRef.current = abortController;
        let targetResponseIndex = responseIndex;
        let responseStarted = responseIndex !== undefined;

        if (targetResponseIndex === undefined) {
            setChat([...displayChat, { type: "prompt", text: prompt }]);
        } else {
            const next = [...displayChat];
            const response = next[targetResponseIndex];

            if (response?.type !== "response") {
                setIsLoading(false);
                return;
            }

            const versions = [...getResponseVersions(response), ""];
            next[targetResponseIndex] = {
                ...response,
                text: "",
                versions,
                activeVersion: versions.length - 1,
            };
            setChat(next);
            setStreamingResponseIndex(targetResponseIndex);
        }

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: abortController.signal,
                body: JSON.stringify({
                    message: prompt,
                    chatId: currentChatId ?? undefined,
                    history: getConversationHistory(contextChat),
                    savePrompt,
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

            const handleStreamEvent = (event: ChatStreamEvent) => {
                if (event.type === "delta") {
                    if (!responseStarted) {
                        responseStarted = true;
                        targetResponseIndex = displayChat.length + 1;
                        setStreamingResponseIndex(targetResponseIndex);
                        setChat((currentChat) => [
                            ...currentChat,
                            {
                                type: "response",
                                text: event.text,
                                versions: [event.text],
                                activeVersion: 0,
                            },
                        ]);
                        return;
                    }

                    if (targetResponseIndex !== undefined) {
                        updateResponseVersion(
                            targetResponseIndex,
                            (current) => current + event.text
                        );
                    }
                    return;
                }

                if (event.type === "done") {
                    setStreamingResponseIndex(null);

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
            if (abortController.signal.aborted) {
                if (targetResponseIndex !== undefined) {
                    const cancelledResponseIndex = targetResponseIndex;

                    setChat((currentChat) => {
                        const next = [...currentChat];
                        const response = next[cancelledResponseIndex];

                        if (response?.type !== "response") {
                            return currentChat;
                        }

                        const versions = [...getResponseVersions(response)];
                        const activeVersion = response.activeVersion ?? versions.length - 1;

                        if (versions[activeVersion]) {
                            return currentChat;
                        }

                        versions.splice(activeVersion, 1);

                        if (!versions.length) {
                            next.splice(cancelledResponseIndex, 1);
                            return next;
                        }

                        const previousVersion = versions.length - 1;
                        next[cancelledResponseIndex] = {
                            ...response,
                            text: versions[previousVersion],
                            versions,
                            activeVersion: previousVersion,
                        };
                        return next;
                    });
                }
                return;
            }

            console.error(error);
            const message =
                error instanceof Error
                    ? error.message
                    : "Could not reach the chat server.";

            showToast({ type: "error", message });

            if (targetResponseIndex !== undefined) {
                updateResponseVersion(
                    targetResponseIndex,
                    (current) => current || `Error: ${message}`
                );
            } else {
                setChat((currentChat) => [
                    ...currentChat,
                    { type: "response", text: `Error: ${message}` },
                ]);
            }
        } finally {
            if (activeRequestRef.current === abortController) {
                activeRequestRef.current = null;
            }
            setIsLoading(false);
            setStreamingResponseIndex(null);
        }
    };

    const handleOnSend = (userText: string) => {
        if (!userText.trim() || isLoading) return;

        void generateResponse({
            prompt: userText.trim(),
            displayChat: chat,
            contextChat: chat,
            savePrompt: true,
        });
    };

    const handleRegenerate = (responseIndex: number) => {
        const promptIndex = responseIndex - 1;
        const prompt = chat[promptIndex];
        const response = chat[responseIndex];

        if (prompt?.type !== "prompt" || response?.type !== "response") {
            return;
        }

        const truncatedChat = chat.slice(0, responseIndex + 1);

        void generateResponse({
            prompt: prompt.text,
            displayChat: truncatedChat,
            contextChat: truncatedChat.slice(0, promptIndex),
            responseIndex,
            savePrompt: false,
        });
    };

    const handleEditPrompt = (promptIndex: number, text: string) => {
        const responseIndex = promptIndex + 1;
        const response = chat[responseIndex];

        if (response?.type !== "response") {
            return;
        }

        const truncatedChat = chat.slice(0, responseIndex + 1);
        truncatedChat[promptIndex] = { type: "prompt", text };

        void generateResponse({
            prompt: text,
            displayChat: truncatedChat,
            contextChat: truncatedChat.slice(0, promptIndex),
            responseIndex,
            savePrompt: true,
        });
    };

    const selectResponseVersion = (responseIndex: number, versionIndex: number) => {
        setChat((currentChat) => {
            const next = [...currentChat];
            const response = next[responseIndex];

            if (response?.type !== "response") {
                return currentChat;
            }

            const versions = getResponseVersions(response);
            const text = versions[versionIndex];

            if (text === undefined) {
                return currentChat;
            }

            next[responseIndex] = {
                ...response,
                text,
                versions,
                activeVersion: versionIndex,
            };
            return next;
        });
    };

    const handleCancel = () => {
        activeRequestRef.current?.abort();
    };

    return(
        <div className="flex w-full flex-col gap-6 px-0 pb-40 md:px-10">
            <ExportChat
                chat={chat}
                disabled={
                    isLoading ||
                    !chat.some((message) => message.type === "prompt")
                }
            />
            {chat.map((msg, i) => (
                <div key={i}>
                    {msg.type === "prompt" ? (
                        <div className="flex justify-end w-full">
                            <div className="flex w-full max-w-[88%] justify-end md:max-w-[75%]">
                                <Prompt
                                    text={msg.text}
                                    disabled={isLoading}
                                    onEdit={
                                        chat[i + 1]?.type === "response"
                                            ? (text) => handleEditPrompt(i, text)
                                            : undefined
                                    }
                                />
                            </div>
                        </div>
                    ): (
                        <div className="w-full max-w-[820px]">
                            <Response
                                text={msg.text}
                                isStreaming={streamingResponseIndex === i}
                                versionIndex={msg.activeVersion ?? 0}
                                versionCount={getResponseVersions(msg).length}
                                onPreviousVersion={() =>
                                    selectResponseVersion(
                                        i,
                                        (msg.activeVersion ?? 0) - 1
                                    )
                                }
                                onNextVersion={() =>
                                    selectResponseVersion(
                                        i,
                                        (msg.activeVersion ?? 0) + 1
                                    )
                                }
                                onRegenerate={
                                    chat[i - 1]?.type === "prompt" && !isLoading
                                        ? () => handleRegenerate(i)
                                        : undefined
                                }
                            />
                        </div>
                    )}
                </div>
            ))}
            {isLoading && streamingResponseIndex === null && (
                <div className="w-full max-w-[820px]">
                    <TypingIndicator />
                </div>
            )}
            <Input
                onSend={handleOnSend}
                isGenerating={isLoading}
                onCancel={handleCancel}
            />
            <div ref={bottomRef} />
        </div>
    )
}
