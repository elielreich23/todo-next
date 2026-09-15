import Link from 'next/link';
import './policy.css';

export default function PolicyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              At Tasker, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our collaborative task and
              project management platform. Please read this policy carefully.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We collect several types of information to provide and improve our service:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, and username when you create an account</li>
              <li><strong>Workspace Data:</strong> Projects, tasks, comments, and team collaboration content you create</li>
              <li><strong>Usage Data:</strong> How you interact with the platform, features used, and login patterns</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              <li><strong>Communication Data:</strong> Messages sent through our contact forms or support channels</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our task management service</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, security alerts, and support messages</li>
              <li>Respond to comments, questions, and customer service requests</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our service</li>
              <li>Detect, investigate, and prevent security incidents and fraud</li>
              <li>Comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Data Ownership and Control</h2>
            <p>
              Your workspace data belongs to you. We use it only to run Tasker, improve reliability,
              and support your team. We do not sell personal information. You can request access,
              correction, or deletion of your account data at any time by contacting us.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Data Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>With Your Consent:</strong> When you explicitly consent to sharing</li>
              <li><strong>Team Collaboration:</strong> With team members you invite to your workspaces</li>
              <li><strong>Service Providers:</strong> With trusted third parties who assist in operating our service</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. However,
              no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and
              fulfill the purposes outlined in this policy. When you delete your account, we will delete
              your personal information unless we are required to retain it for legal or security purposes.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>
              To exercise these rights, please contact us at hello@tasker.com with your request.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites or integrate with third-party services
              (such as Google for authentication). We are not responsible for the privacy practices of
              these third parties. We encourage you to review their privacy policies.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Children's Privacy</h2>
            <p>
              Our service is not intended for children under the age of 13. We do not knowingly collect
              personal information from children under 13. If you are a parent or guardian and believe
              your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country
              of residence. We ensure appropriate safeguards are in place to protect your personal data
              in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page and updating the "Last updated" date.
              Your continued use of the service after such modifications constitutes your acceptance of the new policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="legal-contact">
              Email: <a href="mailto:hello@tasker.com">hello@tasker.com</a>
            </p>
            <p className="legal-contact">
              We will respond to your inquiry within one business day.
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
