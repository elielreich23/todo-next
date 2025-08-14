"use client";

import React from "react";
import { useRouter } from 'next/navigation';
import './style/landing.scss';

export default function Home() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('../../auth/signin');
  };

  const handleSignup = () => {
    router.push('../../auth/signup');
  };

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  const handleHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      {/* HEADER */}
      <header className="header">
        <div className="logo">tasker</div>
        <nav>
          <a href="#hero">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="auth-buttons">
          <button className="login-btn" onClick={handleLogin}>Login</button>
          <button className="signup-btn" onClick={handleSignup}>Sign Up</button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="hero">
        <div className="hero-text">
          <h1>Your <span className="highlight">Ultimate</span> Task Management Solution</h1>
          <p>Organize tasks efficiently, achieve more, and reduce stress efficiently</p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={handleGetStarted}>Get Started →</button>
            <button className="secondary-btn" onClick={handleHowItWorks}>How it Works</button>
          </div>
        </div>
        <div className="hero-graphic">
          <div className="circle">Lorem Ipsum</div>
          <div className="circle">Lorem Ipsum</div>
          <div className="circle">Lorem Ipsum</div>
          <div className="circle">Lorem Ipsum</div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="features">
        <h2>Key <span className="highlight">Features</span></h2>
        <div className="features-grid">
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
        <div className="steps-container">
          <div className="step">
            <div className="step-icon">
              <span>1</span>
            </div>
            <h3>Sign up</h3>
            <p>Create your account in minutes</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <span>2</span>
            </div>
            <h3>Select a Plan</h3>
            <p>Choose the perfect plan for your needs</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <span>3</span>
            </div>
            <h3>Start Tasking</h3>
            <p>Begin organizing and managing your tasks</p>
          </div>
        </div>
      </section>

      {/* VISION MISSION VALUES SECTION */}
      <section id="vision-mission" className="vision-mission">
        <div className="vmv-container">
          <div className="vmv-card">
            <h3>Our Vision</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
          <div className="vmv-card">
            <h3>Our Mission</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
          <div className="vmv-card">
            <h3>Our Core Values</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
        </div>
      </section> 

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="testimonials">
        <h2>Testimonials</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <img src="/api/placeholder/60/60" alt="Alina Delvi" />
            </div>
            <h4>Alina Delvi</h4>
            <p className="testimonial-role">CEO, Delvi HR</p>
            <div className="rating">
              ⭐⭐⭐⭐⭐
            </div>
            <p className="testimonial-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <img src="/api/placeholder/60/60" alt="John Smith" />
            </div>
            <h4>John Smith</h4>
            <p className="testimonial-role">Product Manager, TechCorp</p>
            <div className="rating">
              ⭐⭐⭐⭐⭐
            </div>
            <p className="testimonial-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <img src="/api/placeholder/60/60" alt="Sarah Johnson" />
            </div>
            <h4>Sarah Johnson</h4>
            <p className="testimonial-role">Developer, StartupXYZ</p>
            <div className="rating">
              ⭐⭐⭐⭐⭐
            </div>
            <p className="testimonial-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="pricing">
        <h2>We have something for you</h2>
        <div className="pricing-cards">
                     <div className="pricing-card basic">
             <h3>Basic Plan</h3>
             <div className="price">
               <span className="amount">$99.99</span>
               <span className="period">/30days</span>
             </div>
             <p className="billing">(billed yearly)</p>
             <div className="features">
               <h4>Features</h4>
               <div className="feature-item">+21 new message</div>
               <div className="feature-item">+21 new message</div>
               <div className="feature-item">+21 new message</div>
             </div>
             <button className="subscribe-btn" onClick={() => router.push('/dashboard')}>Subscribe now</button>
           </div>
          
          <div className="pricing-card enterprise featured">
            <h3>Enterprise</h3>
            <div className="price">
              <span className="amount">$99.99</span>
              <span className="period">/30days</span>
            </div>
            <p className="billing">(billed yearly)</p>
            <div className="features">
              <h4>Features</h4>
              <div className="feature-item">+21 new message</div>
              <div className="feature-item">+21 new message</div>
              <div className="feature-item">+21 new message</div>
            </div>
                         <button className="subscribe-btn featured" onClick={() => router.push('/dashboard')}>Subscribe now</button>
          </div>
          
          <div className="pricing-card standard">
            <h3>Standard</h3>
            <div className="price">
              <span className="amount">$99.99</span>
              <span className="period">/30days</span>
            </div>
            <p className="billing">(billed yearly)</p>
            <div className="features">
              <h4>Features</h4>
              <div className="feature-item">+21 new message</div>
              <div className="feature-item">+21 new message</div>
              <div className="feature-item">+21 new message</div>
            </div>
                         <button className="subscribe-btn" onClick={() => router.push('/dashboard')}>Subscribe now</button>
          </div>
        </div>
        
        <div className="taskers-section">
          <div className="taskers-brand">taskers</div>
                     <div className="taskers-buttons">
             <button className="get-started-btn" onClick={() => router.push('/dashboard')}>Get Started →</button>
             <button className="show-all-plans-btn" onClick={() => router.push('/dashboard')}>Show all Plans</button>
           </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="contact">
        <div className="contact-header">
          <button className="contact-title">Contact Us</button>
        </div>
        <div className="contact-content">
          <div className="contact-left">
            <h3>Stay in touch</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>123, Jackson Villa, Lungu, USA</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>+1 895 421 6758</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <span>enquire@taskers.workplace</span>
              </div>
            </div>
          </div>
          <div className="contact-right">
            <h3>Send Us a Message</h3>
            <div className="contact-form">
              <div className="form-group">
                <input type="text" placeholder="Full Name" className="form-input" />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Email Address" className="form-input" />
              </div>
              <div className="form-group">
                <input type="url" placeholder="Website URL" className="form-input" />
              </div>
              <div className="form-group">
                <textarea placeholder="Your Message" className="form-textarea" rows="4"></textarea>
              </div>
                             <button className="submit-btn" onClick={() => router.push('/dashboard')}>Submit</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">taskers</div>
            <p className="footer-tagline">Committing to making work process easier.</p>
          </div>
          
          <div className="footer-middle">
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#policy">Our Policy</a></li>
                <li><a href="#values">Our Values</a></li>
                <li><a href="#mission">Our Mission</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Help</h4>
              <ul>
                <li><a href="#faqs">FAQs</a></li>
                <li><a href="#legal">Legal</a></li>
                <li><a href="#terms">Terms & Condition</a></li>
                <li><a href="#contact">Send message</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-right">
            <h4>Socials</h4>
            <div className="social-links">
              <a href="#facebook">Facebook</a>
              <a href="#instagram">Instagram</a>
              <a href="#linkedin">LinkedIn</a>
              <a href="#twitter">Twitter</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="copyright">
            © 2024 Taskers all right reserved
          </div>
          <button className="scroll-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
