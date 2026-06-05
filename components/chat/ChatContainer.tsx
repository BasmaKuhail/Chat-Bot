import { useState } from "react";
import Prompt from "./Prompt";
import Response from "./Response";
import TypingIndicator from "./TypingIndicator";
import Input from "../Input";
import { useEffect, useRef } from "react"
import { useChat } from "@/context/chatContext"
import { useToast } from "@/context/toastContext";

export default function ChatContainer(){
    const {chat, setChat, currentChatId, setCurrentChatId} = useChat();
    const { showToast } = useToast();
    
    const bottomRef = useRef<HTMLDivElement>(null)
    
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chat])

    const [isLoading, setIsLoading] = useState(false);

const handleOnSend = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    setIsLoading(true);
    setChat(prev => [...prev, { type: "prompt", text: userText }]);

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: userText,
                chatId: currentChatId ?? undefined,
            }),
        });
        
        const data = await res.json();
        const reply = data.reply || "Sorry, I encountered an error.";
        const saveError =
            typeof data.saveError === "string" ? data.saveError : undefined;

        if (saveError) {
            showToast({ type: res.ok ? "info" : "error", message: saveError });
        } else if (!res.ok) {
            showToast({ type: "error", message: reply });
        }

        if (res.ok && typeof data.chatId === "string") {
            setCurrentChatId(data.chatId);
        }

        setChat((prev) => [
            ...prev,
            { type: "response", text: saveError || res.ok ? reply : `Error: ${reply}` },
        ]);
        
    } catch (error) {
        console.error(error);
        showToast({ type: "error", message: "Could not reach the chat server." });
        setChat((prev) => [
            ...prev,
            { type: "response", text: "Error: Could not reach the chat server." },
        ]);
    } finally {
        setIsLoading(false);
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
                    ): <div className="w-full max-w-[820px]"><Response text={msg.text}/></div>}
                </div>
            ))}
            {isLoading && (
                <div className="w-full max-w-[820px]">
                    <TypingIndicator />
                </div>
            )}
            <Input onSend={handleOnSend}/>
            <div ref={bottomRef} />
        </div>
    )
}
