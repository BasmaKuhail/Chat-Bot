import Attach from "@/public/icons/Attach"
import SendBtn from "./SendBtn"
import { useRef, useState } from "react";

export default function Input ({onSend}:{onSend: (userText: string) => void}){
    const [userInput, setUserInput] = useState("");
    
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    return(
        <div className="fixed bottom-0 left-0 flex w-full flex-col items-center justify-end gap-2 rounded-t-[12px] bg-white-10 px-3 pb-4 md:left-80 md:w-[calc(100%-20rem)] md:px-10 md:pr-19">
            <div className="flex w-full flex-row items-end justify-between gap-3 rounded-[10px] bg-white-5 p-3 text-gray-500 md:gap-4 md:p-4">
                <div className="hidden rounded-full bg-gray-100 p-3 hover:bg-gray-200 sm:block">
                    <Attach/>
                </div>
                
                <textarea  
                    className="max-h-[180px] w-full resize-none overflow-hidden whitespace-pre-wrap break-words overflow-y-auto text-sm focus:outline-none md:max-h-[200px] md:text-base" 
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
            <p className="text-center text-xs text-gray-400 md:text-14px">AI models can occasionally hallucinate. Please verify critical information.</p>
        </div>
    )
}
