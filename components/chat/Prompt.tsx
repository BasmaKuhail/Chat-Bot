export default function Prompt({text}: {text: string}){
    return(
        <div className="bg-blue-100 p-4 rounded-b-[13px] rounded-l-[13px] shadow-md px-8 w-fit">
            {text}
        </div>
    )
}