import Link from 'next/link';
import './terms.css';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-nav">
          <Link href="/" className="legal-logo">Tasker</Link>
          <nav className="legal-nav-links">
            <Link href="/">Home</Link>
            <Link href="/auth/signin">Sign In</Link>
            <Link href="/auth/signup">Sign Up</Link>
          </nav>
        </div>
      </header>

      <main className="legal-content">
        <div className="legal-container">
          <h1>Terms of Use</h1>
          <p className="legal-updated">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Tasker, you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of Service</h2>
            <p>
              Tasker is a collaborative task and project management platform designed for startups and student teams.
              Our service provides real-time collaboration tools, shared project workspaces, task management features,
              and team coordination capabilities.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. User Responsibilities</h2>
            <p>As a user of Tasker, you agree to:</p>
            <ul>
              <li>Provide accurate and complete information when creating your account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the service only for legitimate business or educational purposes</li>
              <li>Respect the intellectual property rights of others</li>
              <li>Not attempt to disrupt or interfere with the service's operation</li>
              <li>Not upload malicious content or code to the platform</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to notify Tasker immediately of any unauthorized use of your account or any other breach of security.
              Tasker cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Content and Data</h2>
            <p>
              You retain ownership of all content you create, upload, or store within Tasker.
              Tasker does not claim ownership of your data. However, by using our service, you grant us
              the right to store, process, and transmit your data solely for the purpose of providing the service.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Privacy Policy</h2>
            <p>
              Your use of Tasker is also governed by our Privacy Policy, which describes how we collect,
              use, and protect your personal information. Please review our Privacy Policy carefully.
            </p>
            <Link href="/policy" className="legal-link">View Privacy Policy</Link>
          </section>

          <section className="legal-section">
            <h2>7. Service Availability</h2>
            <p>
              Tasker strives to maintain high availability but does not guarantee uninterrupted service.
              We reserve the right to modify, suspend, or discontinue the service at any time with or without notice.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Tasker shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including without limitation, loss of profits,
              data, use, goodwill, or other intangible losses, resulting from your access to or use of
              or inability to access or use the service.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Termination</h2>
            <p>
              Tasker reserves the right to terminate or suspend your account and access to the service at our sole discretion,
              without prior notice, for conduct that we believe violates these Terms of Use or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to Terms</h2>
            <p>
              Tasker reserves the right to modify these terms at any time. We will notify users of significant changes
              via email or through the service. Your continued use of the service after such modifications constitutes
              your acceptance of the new terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Information</h2>
            <p>
              If you have questions about these Terms of Use, please contact us at:
            </p>
            <p className="legal-contact">
              Email: <a href="mailto:hello@tasker.com">hello@tasker.com</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-content">
          <p>&copy; {new Date().getFullYear()} Tasker. All rights reserved.</p>
          <div className="legal-footer-links">
            <Link href="/terms">Terms of Use</Link>
            <Link href="/policy">Privacy Policy</Link>
            <Link href="/">Back to Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
