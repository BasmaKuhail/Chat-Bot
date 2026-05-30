import Attach from "@/public/icons/Attach"
import SendBtn from "./SendBtn"
import { useRef, useState } from "react";

export default function Input ({onSend}:{onSend: (userText: string) => void}){
    const [userInput, setUserInput] = useState("");
    
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    return(
        <div className="flex flex-col justify-end items-center gap-2 fixed bottom-0 left-80 w-[calc(100%-20rem)] bg-white-10 rounded-t-[12px] pb-4 px-10 pr-19">
            <div className="w-full flex flex-row items-end justify-between bg-white-5 p-4 text-gray-500 gap-4 rounded-[10px]">
                <div className="p-3 rounded-full bg-gray-100 hover:bg-gray-200">
                    <Attach/>
                </div>
                
                <textarea  
                    className="w-full resize-none overflow-hidden whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto focus:outline-none" 
                    placeholder="Ask a question or provide research notes..." 
                    ref={textareaRef}
                    value={userInput}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setUserInput(e.target.value);

                        const target = e.target;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!userInput.trim()) return;
                            onSend(userInput);
                            setUserInput("");
                        }
                    }}>
                    
                </textarea>
                <SendBtn 
                    onClick={() =>{
                        if (!userInput.trim()) return; 
                        onSend(userInput); 
                        setUserInput("")
                        if (textareaRef.current) {
                            textareaRef.current.style.height = "auto";
                        }
                    }}
                />
            </div>
            <p className="text-14px text-gray-400">AI models can occasionally hallucinate. Please verify critical information.</p>
        </div>
    )
}
