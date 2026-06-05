import { type FC } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

const IconLipstick: FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m9 11 3-2V4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v5l-3 2" />
    <rect width="8" height="12" x="8" y="11" rx="2" />
  </svg>
);

export default IconLipstick;