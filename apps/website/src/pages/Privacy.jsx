import { Link } from 'react-router-dom';
import LandingLayout from '../layouts/LandingLayout';
import Logo from '../components/Logo';

export default function Privacy() {
  return (
    <LandingLayout>
      <div className="legal-page">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: March 18, 2026</p>

        <section>
          <h2>8.1 Information We Collect</h2>
          <p>
            We collect information you provide directly, such as your name, email address, and payment information
            when you create an account or subscribe to a paid plan. We also collect usage data automatically,
            including your IP address, browser type, device information, pages visited, and interactions with the
            service. When you create presentations, we store the content and metadata necessary to render and
            share them.
          </p>
        </section>

        <section>
          <h2>8.2 How We Use Your Information</h2>
          <p>
            We use your information to provide, maintain, and improve the service; to process transactions and
            send related communications; to respond to your requests and provide customer support; to monitor
            usage patterns and analyze trends; to detect, prevent, and address technical issues and security
            threats; and to send you updates, marketing communications, and other information that may be of
            interest to you, subject to your communication preferences.
          </p>
        </section>

        <section>
          <h2>8.3 How We Share Your Information</h2>
          <p>
            We do not sell your personal information. We may share your information with third-party service
            providers who assist us in operating the service, such as payment processors, hosting providers,
            and analytics services. We may also share information when required by law, to protect our rights,
            or in connection with a merger, acquisition, or sale of assets. When you share a presentation via
            a public link, the content of that presentation is accessible to anyone with the link.
          </p>
        </section>

        <section>
          <h2>8.4 Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide
            you the service. We will retain and use your information as necessary to comply with legal obligations,
            resolve disputes, and enforce our agreements. Presentation data is retained for the duration of your
            account. You may request deletion of your account and associated data at any time.
          </p>
        </section>

        <section>
          <h2>8.5 Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information, including
            encryption in transit and at rest, access controls, and regular security audits. However, no method
            of transmission over the internet or electronic storage is completely secure. We cannot guarantee
            absolute security of your data.
          </p>
        </section>

        <section>
          <h2>8.6 Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have the right to access, correct, delete, or port your
            personal data; to withdraw consent for data processing; to object to or restrict certain processing
            activities; and to lodge a complaint with a supervisory authority. To exercise any of these rights,
            please contact us at <a href="mailto:privacy@preplai.com">privacy@preplai.com</a>.
          </p>
        </section>

        <section>
          <h2>8.7 International Transfers</h2>
          <p>
            Your information may be transferred to and maintained on servers located outside your country of
            residence. We ensure that such transfers comply with applicable data protection laws by implementing
            appropriate safeguards, such as standard contractual clauses or relying on adequacy decisions.
          </p>
        </section>

        <section>
          <h2>8.8 Children&rsquo;s Privacy</h2>
          <p>
            PreplAI is not intended for children under the age of 13. We do not knowingly collect personal
            information from children under 13. If we become aware that we have collected personal information
            from a child under 13, we will take steps to delete such information promptly.
          </p>
        </section>

        <section>
          <h2>8.9 Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by
            posting the updated policy on this page and updating the "Last updated" date. We encourage you to
            review this policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2>8.10 Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us
            at <a href="mailto:privacy@preplai.com">privacy@preplai.com</a>.
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Logo />
            <p>Don&rsquo;t read it. Watch it.</p>
          </div>
          <div className="footer-columns">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="https://docs.preplai.com" target="_blank" rel="noopener noreferrer">Docs</a>
              <Link to="/dashboard/overview">Dashboard</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/blog">Blog</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} preplai. All rights reserved.
        </div>
      </footer>
    </LandingLayout>
  );
}
