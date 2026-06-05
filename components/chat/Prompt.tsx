export default function Prompt({text}: {text: string}){
    return(
        <div className="w-fit max-w-full whitespace-pre-wrap break-words rounded-b-[13px] rounded-l-[13px] bg-blue-100 p-4 px-6 text-gray-900 shadow-md">
            {text}
        </div>
    )
}
