import React from "react";
import './style/landing.scss';

export default function Home() {
  return (
    <div className="landing-page">
      {/* HEADER */}
      <header className="header">
        <div className="logo">tasker</div>
        <nav>
          <a href="#hero">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
        </nav>
        <div className="auth-buttons">
          <button className="login-btn">Login</button>
          <button className="signup-btn">Sign Up</button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="hero">
        <div className="hero-text">
          <h1>Your <span className="highlight">Ultimate</span> Task Management Solution</h1>
          <p>Organize tasks efficiently, achieve more, and reduce stress efficiently</p>
          <div className="hero-buttons">
            <button className="primary-btn">Get Started →</button>
            <button className="secondary-btn">How it Works</button>
          </div>
        </div>
        <div className="hero-circles">
          <div>Lorem Ipsum</div>
          <div>Lorem Ipsum</div>
          <div>Lorem Ipsum</div>
          <div>Lorem Ipsum</div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="features">
        <h2>Key <span className="highlight">Features</span></h2>
        <div className="features-list">
          <div className="feature-card">
            <h3>Fast documentation</h3>
            <p>Follow up on team and development tasks easily.</p>
          </div>
          <div className="feature-card">
            <h3>Mandem Project</h3>
            <p>Building a web3 mobile application project.</p>
          </div>
          <div className="feature-card">
            <h3>AI Features</h3>
            <p>Schedule emails, tasks, and reminders automatically.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="how-it-works">
        <h2>How It Works</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </section>
    </div>
  );
}
