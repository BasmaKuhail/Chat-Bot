export default function TypingIndicator() {
  return (
    <div className="w-fit rounded-b-[13px] rounded-r-[13px] border border-gray-100 bg-white-0 p-4 px-5 shadow-sm">
      <div className="flex items-center gap-1.5" aria-label="AI is typing">
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.24s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.12s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
      </div>
    </div>
  );
}
