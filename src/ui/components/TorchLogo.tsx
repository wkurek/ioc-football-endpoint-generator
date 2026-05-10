interface TorchLogoProps {
  className?: string;
}

export function TorchLogo({ className }: TorchLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="torch-flame-gradient" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 C13 5, 15 6, 15.5 9 C16 11, 15 13, 13 13 L11 13 C9 13, 8 11, 8.5 9 C9 6, 11 5, 12 2 Z"
        fill="url(#torch-flame-gradient)"
      />
      <path d="M6.5 13 L17.5 13 L14 16 L14 22 L10 22 L10 16 Z" fill="#475569" />
    </svg>
  );
}
