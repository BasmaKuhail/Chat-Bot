import { ReactNode } from "react";

export default function Card({children}:{children:ReactNode}){
    return(
        <div className="flex flex-col gap-2 p-10 bg-white-0 shadow-lg w-[70%] items-center justify-center rounded-[15px]">
            {children}
        </div>
    )
}