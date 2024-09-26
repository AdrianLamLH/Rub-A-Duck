// components/ClickableLogo.js
'use client'

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function ClickableLogo({ src, alt, width, height, size = 'normal' }) {
  const pathname = usePathname();

  const handleLogoClick = (e) => {
    if (pathname === '/home') {
      e.preventDefault();
      window.scrollTo(0, 0);
    }
  };

  const sizeClasses = size === 'small' ? 'w-24' : 'w-40';

  return (
    <Link href="/" onClick={handleLogoClick}>
      <Image
        className={`dark:invert cursor-pointer transition-all duration-300 ${sizeClasses}`}
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority
      />
    </Link>
  );
}