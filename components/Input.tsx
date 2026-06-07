import Attach from "@/public/icons/Attach"
import SendBtn from "./SendBtn"
import { useRef, useState } from "react";

type InputProps = {
    onSend: (userText: string) => void;
    isGenerating?: boolean;
    onCancel?: () => void;
};

export default function Input ({
    onSend,
    isGenerating = false,
    onCancel,
}: InputProps){
    const [userInput, setUserInput] = useState("");
    
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    return(
        <div className="fixed bottom-0 left-0 z-30 flex w-full flex-col items-center justify-end gap-2 rounded-t-[12px] bg-white-10/95 px-3 pb-4 pt-2 backdrop-blur-sm md:left-80 md:w-[calc(100%-20rem)] md:px-10 md:pr-19">
            {isGenerating && onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="cursor-pointer rounded-full border border-gray-200 bg-white-0 px-4 py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                >
                    Cancel response
                </button>
            )}
            <div className="flex w-full flex-row items-end justify-between gap-3 rounded-[12px] border border-gray-100 bg-white-5 p-3 text-gray-500 shadow-sm md:gap-4 md:p-4">
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
                            if (!userInput.trim() || isGenerating) return;
                            onSend(userInput);
                            setUserInput("");
                        }
                    }}>
                    
                </textarea>
                <SendBtn 
                    onClick={() =>{
                        if (!userInput.trim() || isGenerating) return;
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
