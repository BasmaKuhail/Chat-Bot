import Image from "next/image";
import ProfileIcon from "@/public/icons/ProfileIcon"
import Settings from "@/public/icons/Settings"
import logo from "@/public/images/logo.png"
export default function Header (){
    return(
        <div className="bg-white-0 p-3 shadow-sm px-20 flex flex-row items-center justify-between fixed top-0 left-0 w-full">
            <Image src={logo} alt="logo" width={150}/> 
            <div className="flex flex-row gap-8">
                <ProfileIcon className="text-gray-500 hover:text-blue-10 w-6 h-6" />
                <Settings className="text-gray-500 hover:text-blue-10 w-6 h-6" />
            </div>
            
        </div>
    )
}