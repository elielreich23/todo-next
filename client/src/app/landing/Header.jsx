"use client";

import React from 'react';
import Link from 'next/link';

const Header = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <header className="header">
      <nav className="navbar">
        <div className="logo">taskers</div>
        
        <ul className="navLinks">
          <li><button onClick={() => scrollToSection('features')}>Features</button></li>
          <li><button onClick={() => scrollToSection('how-it-works')}>How It Works</button></li>
          <li><button onClick={() => scrollToSection('features')}>About</button></li>
          <li><button onClick={() => scrollToSection('how-it-works')}>FAQs</button></li>
        </ul>
        
        <div className="authLinks">
          <Link href="/auth/signin" className="login">Login</Link>
          <Link href="/auth/signup" className="signup">Sign Up</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
