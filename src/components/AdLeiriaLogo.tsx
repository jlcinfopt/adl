import React from 'react';

export interface AdLeiriaLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  layout?: 'horizontal' | 'vertical';
  alt?: string;
  onClick?: () => void;
}

/**
 * Official AD Leiria Logo Component
 * - 100% transparent background (black background removed as requested)
 * - Exact official church logo:
 *   • Official emblem geometry untouched
 *   • Original typography untouched: "adleiria" and "igreja evangélica"
 *   • Zero changes to letters or artwork
 */
export const AdLeiriaLogo: React.FC<AdLeiriaLogoProps> = ({
  className = '',
  size = 46,
  showText = false,
  layout = 'horizontal',
  alt = 'AD Leiria - Assembleia de Deus de Leiria',
  onClick,
}) => {
  const numSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 46;

  // Determine which asset to serve based on display options:
  // 1. Emblem only (showText = false): cropped authentic high-definition emblem
  // 2. Vertical lockup (showText = true & layout = 'vertical'): emblem on top, original title and subtitle centered below
  // 3. Horizontal lockup (showText = true & layout = 'horizontal'): emblem on left, original title and subtitle on right
  const src = !showText
    ? '/adleiria-emblem-cropped.png'
    : layout === 'vertical'
      ? '/adleiria-logo-vertical.png'
      : '/adleiria-logo-horizontal.png';

  // Compute dimensions based on original aspect ratios
  // emblem: 781x838 (~0.932 ratio)
  // vertical: 475x440 (~1.08 ratio)
  // horizontal: 660x204 (~3.235 ratio)
  const getStyle = () => {
    if (!showText) {
      return {
        height: `${numSize}px`,
        width: `${Math.round(numSize * 0.932)}px`,
      };
    }
    if (layout === 'vertical') {
      return {
        height: `${numSize}px`,
        width: `${Math.round(numSize * 1.08)}px`,
      };
    }
    return {
      height: `${numSize}px`,
      width: `${Math.round(numSize * 3.235)}px`,
    };
  };

  return (
    <img
      src={src}
      alt={alt}
      style={getStyle()}
      className={`select-none object-contain drop-shadow-xs transition-opacity shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
      referrerPolicy="no-referrer"
      onClick={onClick}
    />
  );
};

