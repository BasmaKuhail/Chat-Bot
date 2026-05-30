import PlusIcon from "@/public/icons/Plus";
import ChatIcon from "@/public/icons/Chat";
import HistoryIcon from "@/public/icons/History";
import ArchiveIcon from "@/public/icons/Archived";

import Btn from "./Btn";
import SideNavItem from "./SideNavItem";
import Image from "next/image";
import logo from "@/public/images/logo.png"
import { useChat } from "@/context/chatContext";


export default function SideNav(){
    const {resetChat} = useChat();

    const SideNavBtns = [
        {title: "Current Chat" , image: <ChatIcon className="text-blue-10"/>, isSelected:true},
        {title: "History" , image: <HistoryIcon/>, isSelected:false},
        {title: "Archive" , image: <ArchiveIcon/>, isSelected:false},
    ]
    
    return(
        <div className="bg-white-5 flex flex-col p-2 pl-20 shadow-sm p-4 pr-6 min-h-screen pt-10 opacity:50 gap-10 fixed left-0">
            <Image src={logo} alt="logo" width={150}/> 
            <Btn 
                onClick={resetChat}
            >
                <div className="flex flex-row gap-3 items-center justify-start w-full">
                    <PlusIcon className="text-white-0"/>
                    New Chat
                </div>
            </Btn>
            <div className="flex flex-col gap-2">
                {SideNavBtns.map((btn)=> 
                    <SideNavItem isSelected={btn.isSelected}>
                        <div className="flex flex-row gap-3 items-center justify-center cursor-pointer">
                            {btn.image}
                            {btn.title}
                        </div>
                    </SideNavItem>
                )}
            </div>
            
        </div>
    )
}