type TypingIndicatorProps = {
  compact?: boolean;
};

export default function TypingIndicator({
  compact = false,
}: TypingIndicatorProps) {
  if (compact) {
    return (
      <div
        className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs font-medium text-gray-400"
        role="status"
        aria-label="AI is still generating"
      >
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-10 [animation-delay:-0.24s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-10 [animation-delay:-0.12s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-10" />
        </div>
        <span>Still generating</span>
      </div>
    );
  }

  return (
    <div className="w-fit rounded-b-[13px] rounded-r-[13px] border border-gray-100 bg-white-0 p-4 px-5 shadow-sm">
      <div
        className="flex items-center gap-1.5"
        role="status"
        aria-label="AI is typing"
      >
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.24s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.12s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
      </div>
    </div>
  );
}
