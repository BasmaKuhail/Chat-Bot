export default function Btn ({children, onClick}:{children:React.ReactNode, onClick:{() : void}}){
    return(
        <button onClick={onClick} className="new-chat-button cursor-pointer bg-gradient-to-r from-[#0050D5] to-[#7B9CFF] text-white font-semibold py-3 px-15 rounded-[12px] hover:opacity-90 transition shadow-lg">
            {children}
        </button>
    )
}
