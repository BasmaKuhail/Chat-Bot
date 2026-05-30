import { useState } from "react";
import Prompt from "./Prompt";
import Response from "./Response";
import { Message } from "@/types/messages";
import Input from "../Input";
import { useEffect, useRef } from "react"

export default function ChatContainer(){

    const bottomRef = useRef<HTMLDivElement>(null)

    
    const [chat, setChat] = useState<Message[]>([{type:"response", text:"Welcome to BrainRot, I'm your AI agient, feel free to share your thoughts with me, I'm here to assist you :)"}])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chat])

    const [isLoading, setIsLoading] = useState(false);

const handleOnSend = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    setIsLoading(true);
    setChat(prev => [...prev, { type: "prompt", text: userText }]);

    try {
        const res = await fetch("/api/chat", { // This matches pages/api/chat.ts
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userText }),
});
        
        const data = await res.json();
        const reply = data.reply || "Sorry, I encountered an error.";

        setChat((prev) => [
            ...prev,
            { type: "response", text: res.ok ? reply : `Error: ${reply}` },
        ]);
        
    } catch (error) {
        console.error(error);
        setChat((prev) => [
            ...prev,
            { type: "response", text: "Error: Could not reach the chat server." },
        ]);
    } finally {
        setIsLoading(false);
    }
};
    return(
        <div className="w-full flex flex-col gap-8 px-10 pb-40">
            {chat.map((msg, i) => (
                <div key={i}>
                    {msg.type === "prompt" ? (
                        <div className="flex justify-end w-full">
                            <div className="w-[70%] flex justify-end"><Prompt text={msg.text}/></div>
                        </div>
                    ): <div className="w-[70%]"><Response  text={msg.text}/></div>}
                </div>
            ))}
            <Input onSend={handleOnSend}/>
            <div ref={bottomRef} />
        </div>
    )
}
