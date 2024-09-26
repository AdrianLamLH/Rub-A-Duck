// components/DynamicHeader.js
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ClickableLogo from './clickable_logo';
import rad_logo from '../../../rad_logo.png'; // Ensure this path is correct

const DynamicHeader = () => {
    const [isScrolled, setIsScrolled] = useState(false);
  
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 100);
      };
  
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);
  
    return (
      <header className="sticky top-0 transition-all duration-300 ease-in-out bg-white z-50">
        <div className={`container mx-auto px-4 py-4 flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-16 shadow-md' : 'h-40'}`}>
          <Link href="/home">
            <h1 className={`font-bold transition-all duration-300 ${isScrolled ? 'text-2xl' : 'text-5xl'}`}>Rub-A-Duck</h1>
          </Link>
          <ClickableLogo
            src={rad_logo}
            alt="Rub-A-Duck logo"
            width={180}
            height={38}
            size={isScrolled ? 'small' : 'normal'}
          />
        </div>
      </header>
    );
  };
  
  export default DynamicHeader;