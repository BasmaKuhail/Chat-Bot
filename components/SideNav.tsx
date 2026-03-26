import PlusIcon from "@/public/icons/Plus";
import Btn from "./Btn";

export default function SideNav(){
    return(
        <div className="bg-white-5 flex flex-col p-2 pl-20 shadow-sm p-4 pr-6 min-h-screen pt-20 opacity:50">
            <Btn>
                <div className="flex flex-row gap-3 items-center justify-center">
                    <PlusIcon className="text-white-0"/>
                    New Chat
                </div>
            </Btn>
        </div>
    )
}