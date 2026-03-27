import Attach from "@/public/icons/Attach"
import SendBtn from "./SendBtn"
export default function Input (){
    return(
        <div className="flex flex-col gap-2 items-center fixed bottom-0 left-80 w-[calc(100%-20rem)] bg-white-10 rounded-t-[12px] pb-4 px-10 pr-19">
            <div className="w-full flex flex-row items-center justify-between bg-white-5 p-4 text-gray-500 gap-4 rounded-[10px]">
                <Attach/>
                <input className="w-full select-none h-full " placeholder="Ask a question or provide research notes..." onChange={(e) => e.target.value}/>
                <SendBtn/>
            </div>
            <p className="text-14px text-gray-400">AI models can occasionally hallucinate. Please verify critical information.</p>
        </div>
    )
}