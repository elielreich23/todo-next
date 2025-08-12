"use client";

import React from 'react';

const HowItWorks = () => {
  return (
    <div className="container">
      <h2 className="sectionTitle">How It Works</h2>
      
      <div className="steps">
        <div className="step">
          <div className="stepIcon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M22 21V19C22 18.1137 21.7315 17.2358 20.2072 16.4999C20.683 15.7641 19.9291 15.2149 19.0709 14.9267C18.2127 14.6385 17.2859 14.6259 16.4197 14.8907C15.5535 15.1555 14.7894 15.6869 14.2148 16.416L22 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="stepTitle">Sign up</h3>
        </div>
        
        <div className="step">
          <div className="stepIcon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="stepTitle">Select a Plan</h3>
        </div>
        
        <div className="step">
          <div className="stepIcon">
            <span className="emojiIcon">😉</span>
          </div>
          <h3 className="stepTitle">Start Tasking</h3>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
