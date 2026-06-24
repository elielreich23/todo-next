"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './style/landing.scss';
import { useUser } from '../../contexts/UserContext';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../constants';

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PRICING_PLANS = [
  {
    id: 'basic',
    name: 'Starter',
    amount: '$9.99',
    features: ['Up to 5 shared projects', 'Real-time task updates', 'Email support'],
  },
  {
    id: 'enterprise',
    name: 'Team',
    amount: '$99.99',
    featured: true,
    features: ['Unlimited projects and teammates', 'Live activity and reporting', 'Priority support'],
  },
  {
    id: 'standard',
    name: 'Growth',
    amount: '$29.99',
    features: ['Unlimited projects for your crew', 'Assignments and due dates', 'Calendar sync'],
  },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();

  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [pricingIndex, setPricingIndex] = useState(0);
  const [contactForm, setContactForm] = useState({
    full_name: '',
    email: '',
    organization: '',
    message: '',
  });
  const [contactStatus, setContactStatus] = useState('');
  const [contactError, setContactError] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const testimonialLength = 3;
  const pricingLength = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonialLength);
      setPricingIndex((prev) => (prev + 1) % pricingLength);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        setShowScrollTop(false);
        return;
      }
      setShowScrollTop(window.scrollY / scrollable > 0.25);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    router.push('/auth/signin');
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signin');
    }
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

  const handleContactChange = (field) => (event) => {
    setContactForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setContactError('');
    setContactStatus('');

    if (!contactForm.full_name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setContactError('Please add your name, email, and message so we can reply.');
      return;
    }

    setIsContactSubmitting(true);

    try {
      const response = await api(
        API_ENDPOINTS.AUTH.CONTACT,
        {
          method: 'POST',
          body: JSON.stringify({
            full_name: contactForm.full_name.trim(),
            email: contactForm.email.trim(),
            organization: contactForm.organization.trim(),
            message: contactForm.message.trim(),
          }),
        },
        false
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Message could not be sent.');
      }

      setContactStatus('Thanks. Your message has been sent to the Tasker team.');
      setContactForm({
        full_name: '',
        email: '',
        organization: '',
        message: '',
      });
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Message could not be sent. Please try again.');
    } finally {
      setIsContactSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      {/* HEADER */}
      <header className="header">
        <div className="logo">Tasker</div>
        <nav>
          <a href="#hero">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="auth-buttons">
          {isLoading ? (
            <span className="auth-loading" aria-hidden="true" />
          ) : isAuthenticated ? (
            <button type="button" className="signup-btn" onClick={handleDashboard}>
              Dashboard
            </button>
          ) : (
            <>
              <button type="button" className="login-btn" onClick={handleLogin}>Login</button>
              <button type="button" className="signup-btn" onClick={handleSignup}>Sign Up</button>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="hero">
        <div className="hero-text">
          <h1>
            Collaborate on tasks and projects in <span className="highlight">real time</span>
          </h1>
          <p>
            Tasker helps startups and student teams plan work together with live updates,
            shared projects, and an interface that stays simple as you grow.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={handleGetStarted}>
              Get Started <ArrowRight />
            </button>
            <button className="secondary-btn" onClick={handleHowItWorks}>How it Works</button>
          </div>
        </div>
        <div className="hero-graphic">
          <div className="circle">Live sync</div>
          <div className="circle">Projects</div>
          <div className="circle">Tasks</div>
          <div className="circle">Teams</div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="features">
        <h2>Key <span className="highlight">Features</span></h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Real-time collaboration</h3>
            <p>
              See task and project changes as they happen so your team never works from
              an outdated board.
            </p>
          </div>
          <div className="feature-card">
            <h3>Shared projects</h3>
            <p>
              Organize work by project, assign owners, and track progress together without
              spreadsheet chaos.
            </p>
          </div>
          <div className="feature-card">
            <h3>Built for small teams</h3>
            <p>
              Startups and student groups get an intuitive workspace that is easy to learn
              and quick to adopt.
            </p>
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
            <h3>Create your workspace</h3>
            <p>Sign up free and invite teammates in minutes</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <span>2</span>
            </div>
            <h3>Set up projects</h3>
            <p>Add projects, break them into tasks, and assign work</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <span>3</span>
            </div>
            <h3>Collaborate live</h3>
            <p>Track updates in real time and ship work together</p>
          </div>
        </div>
      </section>

      {/* ABOUT, VALUES & POLICY */}
      <section className="company-info">
        <h2>Why <span className="highlight">Tasker</span></h2>
        <div className="company-info-grid">
          <article id="about" className="info-card">
            <h3>About Tasker</h3>
            <p>
              Tasker is a collaborative, real-time web app for managing tasks and projects in a
              simple, intuitive way. We focus on teams that need to move fast—especially startups
              and students—so everyone stays aligned without heavy setup or training.
            </p>
          </article>
          <article id="values" className="info-card">
            <h3>Our values</h3>
            <p>
              Clarity over clutter, collaboration by default, and respect for your time. We build
              tools that help people communicate progress openly and finish work together, not in
              silos.
            </p>
          </article>
          <article id="policy" className="info-card">
            <h3>Privacy policy</h3>
            <p>
              Your workspace data belongs to you. We use it only to run Tasker, improve reliability,
              and support your team. We do not sell personal information. Contact us anytime to
              request access, correction, or deletion of your account data.
            </p>
          </article>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="testimonials">
        <h2>Testimonials</h2>
        <div className="carousel">
          <button
            className="carousel-btn prev"
            type="button"
            aria-label="Previous testimonial"
            onClick={() =>
              setTestimonialIndex((prev) => (prev - 1 + testimonialLength) % testimonialLength)
            }
          >
            <ChevronLeft />
          </button>
          <div className="carousel-window">
            <div
              className="testimonials-grid carousel-track"
              style={{ transform: `translateX(-${testimonialIndex * 100}%)` }}
            >
              <div className="testimonial-card">
                <div className="testimonial-avatar">
                  <Image src="/api/placeholder/60/60?seed=alina" alt="Alina Delvi" width={60} height={60} />
                </div>
                <h4>Alina Delvi</h4>
                <p className="testimonial-role">Co-founder, Campus Launch</p>
                <div className="rating" aria-label="5 out of 5 stars">5/5</div>
                <p className="testimonial-text">
                  Our student startup runs entirely on Tasker. Live task updates mean nobody asks
                  &ldquo;what&apos;s the status?&rdquo; in Slack anymore—we just open the board.
                </p>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-avatar">
                  <Image src="/api/placeholder/60/60?seed=john" alt="John Smith" width={60} height={60} />
                </div>
                <h4>John Smith</h4>
                <p className="testimonial-role">Lead, early-stage SaaS team</p>
                <div className="rating" aria-label="5 out of 5 stars">5/5</div>
                <p className="testimonial-text">
                  We replaced scattered spreadsheets with one shared workspace. Releases ship on time
                  because blockers show up early and owners are always clear.
                </p>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-avatar">
                  <Image src="/api/placeholder/60/60?seed=sarah" alt="Sarah Johnson" width={60} height={60} />
                </div>
                <h4>Sarah Johnson</h4>
                <p className="testimonial-role">CS capstone project lead</p>
                <div className="rating" aria-label="5 out of 5 stars">5/5</div>
                <p className="testimonial-text">
                  Clean UI and fast onboarding for our class team. We stayed aligned across time zones
                  without adopting another heavyweight project tool.
                </p>
              </div>
            </div>
          </div>
          <button
            className="carousel-btn next"
            type="button"
            aria-label="Next testimonial"
            onClick={() => setTestimonialIndex((prev) => (prev + 1) % testimonialLength)}
          >
            <ChevronRight />
          </button>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="pricing">
        <h2>Plans for every team size</h2>
        <div className="carousel">
          <button
            className="carousel-btn prev"
            type="button"
            aria-label="Previous plan"
            onClick={() =>
              setPricingIndex((prev) => (prev - 1 + pricingLength) % pricingLength)
            }
          >
            <ChevronLeft />
          </button>
          <div className="carousel-window">
            <div
              className="pricing-cards carousel-track"
              style={{ transform: `translateX(-${pricingIndex * 100}%)` }}
            >
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`pricing-card ${plan.id}${plan.featured ? ' featured' : ''}`}
                >
                  <h3>{plan.name}</h3>
                  <div className="price">
                    <span className="amount">{plan.amount}</span>
                    <span className="period">/month</span>
                  </div>
                  <p className="billing">(billed yearly)</p>
                  <div className="features">
                    <h4>Features</h4>
                    {plan.features.map((feature) => (
                      <div key={feature} className="feature-item">
                        {feature}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`subscribe-btn${plan.featured ? ' featured' : ''}`}
                    onClick={handleGetStarted}
                  >
                    Subscribe now
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button
            className="carousel-btn next"
            type="button"
            aria-label="Next plan"
            onClick={() => setPricingIndex((prev) => (prev + 1) % pricingLength)}
          >
            <ChevronRight />
          </button>
        </div>

        <div className="taskers-section">
          <div className="taskers-brand">Tasker</div>
          <div className="taskers-buttons">
            <button type="button" className="get-started-btn" onClick={handleGetStarted}>
              Get Started <ArrowRight />
            </button>
            <button type="button" className="show-all-plans-btn" onClick={handlePricing}>
              View all plans
            </button>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="contact">
        <div className="contact-header">
          <h2 className="contact-title">Contact Us</h2>
        </div>
        <div className="contact-content">
          <div className="contact-left">
            <h3>Stay in touch</h3>
            <p>
              Questions about plans, onboarding, or student and startup programs? Reach the Tasker
              team and we will respond within one business day.
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon" aria-hidden="true">@</span>
                <a href="mailto:hello@tasker.com">hello@tasker.com</a>
              </div>
              <div className="contact-item">
                <span className="contact-icon" aria-hidden="true">#</span>
                <span>Remote-first team, worldwide</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon" aria-hidden="true">+</span>
                <a href="tel:+18885551234">+1 (888) 555-1234</a>
              </div>
            </div>
          </div>
          <div className="contact-right">
            <h3>Send Us a Message</h3>
            <form className="contact-form" onSubmit={handleContactSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="contact-full-name" className="visually-hidden">
                  Full name
                </label>
                <input
                  id="contact-full-name"
                  name="full_name"
                  type="text"
                  placeholder="Full Name"
                  className="form-input"
                  autoComplete="name"
                  value={contactForm.full_name}
                  onChange={handleContactChange('full_name')}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email" className="visually-hidden">
                  Email address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  className="form-input"
                  autoComplete="email"
                  value={contactForm.email}
                  onChange={handleContactChange('email')}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-organization" className="visually-hidden">
                  Organization
                </label>
                <input
                  id="contact-organization"
                  name="organization"
                  type="text"
                  placeholder="Company or team (optional)"
                  className="form-input"
                  autoComplete="organization"
                  value={contactForm.organization}
                  onChange={handleContactChange('organization')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-message" className="visually-hidden">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Your Message"
                  className="form-textarea"
                  rows={4}
                  value={contactForm.message}
                  onChange={handleContactChange('message')}
                  required
                />
              </div>
              {contactError ? (
                <p className="form-feedback form-feedback--error" role="alert">
                  {contactError}
                </p>
              ) : null}
              {contactStatus ? (
                <p className="form-feedback form-feedback--success" role="status">
                  {contactStatus}
                </p>
              ) : null}
              <button type="submit" className="submit-btn" disabled={isContactSubmitting}>
                {isContactSubmitting ? 'Sending...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">Tasker</div>
            <p className="footer-tagline">
              Real-time task and project management for startups and student teams.
            </p>
          </div>

          <div className="footer-middle">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#how-it-works">How it works</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#values">Our values</a></li>
                <li><a href="#policy">Privacy policy</a></li>
                <li><a href="#testimonials">Stories</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-right">
            <h4>Account</h4>
            <div className="social-links">
              {isAuthenticated ? (
                <a href="/dashboard">Dashboard</a>
              ) : (
                <>
                  <a href="/auth/signup">Create account</a>
                  <a href="/auth/signin">Log in</a>
                </>
              )}
              <a href="#pricing">Compare plans</a>
              <a href="mailto:hello@tasker.com">Email us</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            {`© ${new Date().getFullYear()} Tasker. All rights reserved.`}
          </div>
        </div>
      </footer>

      <button
        type="button"
        className={`scroll-to-top${showScrollTop ? ' scroll-to-top--visible' : ''}`}
        aria-label="Scroll to top"
        aria-hidden={!showScrollTop}
        tabIndex={showScrollTop ? 0 : -1}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp />
      </button>
    </div>
  );
}
