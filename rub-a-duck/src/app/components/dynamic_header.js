// components/DynamicHeader.js
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ClickableLogo from './clickable_logo';
import rad_logo from '../../public/rad_logo.png'; // Ensure this path is correct

const DynamicHeader = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
  
    useEffect(() => {
      const handleScroll = () => {
        const scrollPosition = window.scrollY;
        const progress = Math.min(scrollPosition / 100, 1);
        setScrollProgress(progress);
      };
  
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);
  
    const headerHeight = 100 - (scrollProgress * 30); // Interpolate between 80 and 40
    const fontSize = 3.5 - (scrollProgress * 0.5); // Interpolate between 5 and 2
  
    return (
      <header className="sticky top-0 transition-all duration-100 ease-in-out bg-white z-50 w-full padding-bottom:10px">
        <div 
          className={`container mx-auto px-4 flex items-center justify-between transition-all duration-100 ${scrollProgress > 0.5 ? '' : ''}`}
          style={{ height: `${headerHeight}px`, padding: `${15 - scrollProgress * 2}px 0` }}
        >
          <Link href="/">
            <h1 className="font-bold transition-all duration-100" style={{ fontSize: `${fontSize}rem`, lineHeight: '1' }}>Rub-A-Duck</h1>
          </Link>
          <ClickableLogo
            src={rad_logo}
            alt="Rub-A-Duck logo"
            width={180}
            height={38}
            size={scrollProgress > 0.5 ? 'small' : 'normal'}
          />
        </div>
      </header>
    );
  };
  
  export default DynamicHeader;