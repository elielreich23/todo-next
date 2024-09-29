import "../styles/globals.css"
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import Features from './landing/Features';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
    </>
  );
}
