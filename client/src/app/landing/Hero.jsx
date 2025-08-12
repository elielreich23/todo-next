"use client";

import React from 'react';

const Hero = () => {
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
    <div className="heroContent">
      <div className="heroText">
        <h1 className="headline">
          Your Ultimate <span className="highlight">Task Management</span> Solution
        </h1>
        <p className="subheadline">
          Organize tasks efficiently, achieve more, and reduce stress efficiently
        </p>
        <div className="ctaButtons">
          <button className="getStarted">
            Get Started
            <svg className="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="howItWorks" onClick={() => scrollToSection('how-it-works')}>
            How it Works
          </button>
        </div>
      </div>
      
      <div className="heroVisual">
        <div className="circles">
          <div className="circle">
            <span>Lorem Ipsum</span>
            <span>Task Manager</span>
            <span>Get Organized</span>
            <span>Stay Focused</span>
          </div>
          <div className="circle">
            <span>Lorem Ipsum</span>
            <span>Plan Ahead</span>
            <span>Track Progress</span>
            <span>Achieve Goals</span>
          </div>
          <div className="circle">
            <span>Lorem Ipsum</span>
            <span>Team Sync</span>
            <span>Real-time</span>
            <span>Collaborate</span>
          </div>
          <div className="circle">
            <span>Lorem Ipsum</span>
            <span>Smart AI</span>
            <span>Auto-sort</span>
            <span>Optimize</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
