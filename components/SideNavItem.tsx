type itemProps ={
    text: string
}
export default function SideNavItem({children, isSelected}:{children:React.ReactNode, isSelected:boolean}){
    return(
        <div className={`text-16px rounded-[12px] cursor-pointer ${isSelected? "bg-white-0 text-blue-10 shadow-sm" : "text-gray-500"}
                " p-3 px-5 
                flex items-center 
                font-semibold 
                hover:bg-gray-100 
                `}
        >
            {children}
        </div>
    )
}