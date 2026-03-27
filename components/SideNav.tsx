import PlusIcon from "@/public/icons/Plus";
import ChatIcon from "@/public/icons/Chat";
import HistoryIcon from "@/public/icons/History";
import ArchiveIcon from "@/public/icons/Archived";

import Btn from "./Btn";
import SideNavItem from "./SideNavItem";
import Image from "next/image";
import logo from "@/public/images/logo.png"

// const SideNavBtns = [
//     {title: "current chat" , image: ""},
//     {title: "current chat" , image: ""},
//     {title: "current chat" , image: ""},
//     {title: "current chat" , image: ""},
// ]
export default function SideNav(){
    return(
        <div className="bg-white-5 flex flex-col p-2 pl-20 shadow-sm p-4 pr-6 min-h-screen pt-10 opacity:50 gap-10 fixed left-0">
            <Image src={logo} alt="logo" width={150}/> 
            <Btn>
                <div className="flex flex-row gap-3 items-center justify-center">
                    <PlusIcon className="text-white-0"/>
                    New Chat
                </div>
            </Btn>
            <div className="flex flex-col gap-2">
                <SideNavItem isSelected={true}>
                    <div className="flex flex-row gap-3 items-center justify-center">
                        <ChatIcon/>
                        Current Chat
                    </div>
                </SideNavItem>
                <SideNavItem isSelected={false}>
                    <div className="flex flex-row gap-3 items-center justify-center">
                        <HistoryIcon/>
                        History
                    </div>
                </SideNavItem>
                <SideNavItem isSelected={false}>
                    <div className="flex flex-row gap-3 items-center justify-center">
                        <ArchiveIcon/>
                        Archive
                    </div>
                </SideNavItem>
            </div>
            
        </div>
    )
}