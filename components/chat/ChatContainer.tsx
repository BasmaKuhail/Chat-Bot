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
import { useRouter } from "next/router";

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
    const router = useRouter();
    
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const activeRequestRef = useRef<AbortController | null>(null);
    const [activeMatchIndex, setActiveMatchIndex] = useState(0);
    const [matchCount, setMatchCount] = useState(0);

    const highlightQuery =
        router.isReady && typeof router.query.highlight === "string"
            ? router.query.highlight.trim()
            : "";

    useEffect(() => {
        if (!highlightQuery) {
            setActiveMatchIndex(0);
            setMatchCount(0);
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            return;
        }

        const animationFrame = window.requestAnimationFrame(() => {
            const matches = chatContainerRef.current?.querySelectorAll<HTMLElement>(
                "[data-chat-search-match]"
            );
            const nextMatchCount = matches?.length ?? 0;

            setMatchCount(nextMatchCount);
            setActiveMatchIndex(0);
        });

        return () => window.cancelAnimationFrame(animationFrame);
    }, [chat, currentChatId, highlightQuery])

    useEffect(() => {
        if (!highlightQuery || matchCount === 0) {
            return;
        }

        const animationFrame = window.requestAnimationFrame(() => {
            const matches = chatContainerRef.current?.querySelectorAll<HTMLElement>(
                "[data-chat-search-match]"
            );

            if (!matches?.length) {
                return;
            }

            const normalizedIndex =
                Math.min(activeMatchIndex, matches.length - 1);

            matches.forEach((match, index) => {
                match.classList.toggle(
                    "chat-search-match-active",
                    index === normalizedIndex
                );
            });
            matches[normalizedIndex]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        });

        return () => window.cancelAnimationFrame(animationFrame);
    }, [activeMatchIndex, highlightQuery, matchCount]);

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

    const focusMatch = (nextIndex: number) => {
        const matches = chatContainerRef.current?.querySelectorAll<HTMLElement>(
            "[data-chat-search-match]"
        );

        if (!matches?.length) {
            return;
        }

        const normalizedIndex =
            (nextIndex + matches.length) % matches.length;

        setActiveMatchIndex(normalizedIndex);
    };

    return(
        <div
            ref={chatContainerRef}
            className="flex w-full flex-col gap-6 px-0 pb-40 md:px-10"
        >
            {highlightQuery && matchCount > 0 && (
                <div className="sticky top-4 z-30 flex justify-end">
                    <div
                        className="flex items-center gap-1 rounded-[8px] border border-gray-200 bg-white-0 p-1.5 shadow-md"
                        role="group"
                        aria-label={`Search matches for ${highlightQuery}`}
                    >
                        <span
                            className="min-w-16 px-2 text-center text-xs font-semibold text-gray-600"
                            aria-live="polite"
                        >
                            {activeMatchIndex + 1} / {matchCount}
                        </span>
                        <button
                            type="button"
                            onClick={() => focusMatch(activeMatchIndex - 1)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] text-lg font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-blue-10"
                            aria-label="Previous match"
                            title="Previous match"
                        >
                            &#8593;
                        </button>
                        <button
                            type="button"
                            onClick={() => focusMatch(activeMatchIndex + 1)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] text-lg font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-blue-10"
                            aria-label="Next match"
                            title="Next match"
                        >
                            &#8595;
                        </button>
                    </div>
                </div>
            )}
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
                                    highlightQuery={highlightQuery}
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
                                highlightQuery={highlightQuery}
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
