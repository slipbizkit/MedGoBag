import { useId } from 'react';

interface Props {
  size?: number;
  outline?: string;
}

/**
 * Two-tone capsule mark — amber and paper lobes split by an ink outline.
 * The app's brand glyph, echoing the label-stripe urgency device used
 * throughout the UI.
 */
export default function Logo({ size = 22, outline = 'currentColor' }: Props) {
  const clipId = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x="4" y="9" width="16" height="6" rx="3" />
        </clipPath>
      </defs>
      <g transform="rotate(-45 12 12)" clipPath={`url(#${clipId})`}>
        <rect x="4" y="9" width="8" height="6" fill="#E2963A" />
        <rect x="12" y="9" width="8" height="6" fill="#F6F7F2" />
      </g>
      <rect
        x="4" y="9" width="16" height="6" rx="3"
        transform="rotate(-45 12 12)"
        fill="none" stroke={outline} strokeWidth="2"
      />
      <line
        x1="12" y1="9.5" x2="12" y2="14.5"
        transform="rotate(-45 12 12)"
        stroke={outline} strokeWidth="1.4"
      />
    </svg>
  );
}
