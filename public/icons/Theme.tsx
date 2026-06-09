export default function ThemeIcon({
  className,
  isDark,
}: {
  className?: string;
  isDark: boolean;
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r="6.5"
        fill={isDark ? "none" : "currentColor"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {isDark && (
        <path
          d="M13.8 4.7A6.5 6.5 0 0 0 9.6 16.5 6.5 6.5 0 1 1 13.8 4.7Z"
          fill="currentColor"
        />
      )}
    </svg>
  );
}
