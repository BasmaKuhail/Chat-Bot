import Prompt from "./Prompt";
import Response from "./Response";

export default function ChatContainer(){
    return(<div className="w-full flex flex-col gap-8 px-10 pb-40">
        <div className="flex justify-end w-ful">
            <Prompt/>
        </div>
        <Response/><div className="flex justify-end w-ful">
            <Prompt/>
        </div>
        <Response/><div className="flex justify-end w-ful">
            <Prompt/>
        </div>
        <Response/><div className="flex justify-end w-ful">
            <Prompt/>
        </div>
        <Response/><div className="flex justify-end w-ful">
            <Prompt/>
        </div>
        <Response/><div className="flex justify-end w-ful">
            <Prompt/>
        </div>
        <Response/>
    </div>)
}