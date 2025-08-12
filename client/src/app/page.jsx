import React from 'react';
import Header from './landing/Header';
import Hero from './landing/Hero';
import Features from './landing/Features';
import HowItWorks from './landing/HowItWorks';
import './landing/landing.scss';

export default function LandingPage() {
  return (
    <main className="landing-page">
      <Header />
      <section id="hero" className="hero">
        <Hero />
      </section>
      <section id="features" className="features">
        <Features />
      </section>
      <section id="how-it-works" className="howItWorks">
        <HowItWorks />
      </section>
    </main>
  );
}
