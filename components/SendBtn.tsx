import SendIcon from "@/public/icons/Send"
export default function Send ({onClick}: {onClick: () => void}){
    return(
        <div onClick={onClick} className="bg-blue-10 p-2 rounded-[10px] flex items-center justify-center hover:bg-blue-20"> 
            <SendIcon className="text-white-0"/>
        </div>
    )
}