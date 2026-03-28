import { useState } from "react";
import Prompt from "./Prompt";
import Response from "./Response";
import { Message } from "@/types/messages";
import Input from "../Input";
import { useEffect, useRef } from "react"

export default function ChatContainer(){

    const bottomRef = useRef<HTMLDivElement>(null)

    
    const [chat, setChat] = useState<Message[]>([])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chat])

    const handleOnSend = async  (userText:string) =>{
        if (!userText.trim()) return
        // add user prompt
        setChat(prev => [...prev, { type: "prompt", text: userText }])
        try{
            const res= await fetch("api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userText }),
            });
            const data = await res.json();

            // show AI response
            setChat((prev) => [
            ...prev,
            { type: "response", text: data.reply },
            ]);
        } catch (error) {
            console.error(error);
        }
    }
    return(
        <div className="w-full flex flex-col gap-8 px-10 pb-40">
            {chat.map((msg, i) => (
                <div key={i}>
                    {msg.type === "prompt" ? (
                        <div className="flex justify-end w-full">
                            <Prompt text={msg.text}/>
                        </div>
                    ): <Response  text={msg.text}/>}
                </div>
            ))}
            <Input onSend={handleOnSend}/>
            <div ref={bottomRef} />
        </div>
    )
}