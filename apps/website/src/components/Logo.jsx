export default function Logo({ size = 28, showWordmark = true }) {
  return (
    <span className="logo" style={{ '--logo-size': `${size}px` }}>
      <svg
        className="logo-mark"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="6" fill="#0b0c10" />
        <path
          d="M8 8h6a6 6 0 0 1 0 12H8z"
          fill="none"
          stroke="#C9A84C"
          strokeWidth="2.5"
        />
        <circle cx="22" cy="22" r="3" fill="#C9A84C" />
      </svg>
      {showWordmark && <span className="logo-text">preplai</span>}
    </span>
  );
}
