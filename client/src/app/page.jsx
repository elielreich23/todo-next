import React from 'react';
import Header from './landing/Header';
import Hero from './landing/Hero';
import Features from './landing/Features';
import HowItWorks from './landing/HowItWorks';
import '../styles/globals.css';

export default function LandingPage() {
  return (
    <main className="landing-page">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
    </main>
  );
}
