import Attach from "@/public/icons/Attach"
import SendBtn from "./SendBtn"
import { useState } from "react";
import Prompt from "./chat/Prompt";
export default function Input ({onSend}:{onSend: (userText: string) => void}){
    const [userInput, setUserInput] = useState("");
    
    return(
        <div className="flex flex-col justify-end items-center gap-2 fixed bottom-0 left-80 w-[calc(100%-20rem)] bg-white-10 rounded-t-[12px] pb-4 px-10 pr-19">
            <div className="w-full flex flex-row items-end justify-between bg-white-5 p-4 text-gray-500 gap-4 rounded-[10px]">
                <div className="p-3 rounded-full bg-gray-100 hover:bg-gray-200">
                    <Attach/>
                </div>
                
                <textarea  
                    className="w-full resize-none overflow-hidden whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto focus:outline-none" 
                    placeholder="Ask a question or provide research notes..." 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                    }}>
                    
                </textarea>
                <SendBtn onClick={() =>{onSend(userInput); setUserInput("")}}/>
            </div>
            <p className="text-14px text-gray-400">AI models can occasionally hallucinate. Please verify critical information.</p>
        </div>
    )
}