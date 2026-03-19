import { Link } from 'react-router-dom';
import LandingLayout from '../layouts/LandingLayout';
import Logo from '../components/Logo';

export default function Terms() {
  return (
    <LandingLayout>
      <div className="legal-page">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: March 18, 2026</p>

        <section>
          <h2>7.1 Account Registration</h2>
          <p>
            To access certain features of Preplai, you must create an account. You agree to provide accurate,
            current, and complete information during registration and to keep your account information up to date.
            You are responsible for safeguarding your password and for all activities that occur under your account.
            You must notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2>7.2 Use of the Service</h2>
          <p>
            Preplai grants you a limited, non-exclusive, non-transferable, revocable license to use the service
            in accordance with these terms. You agree not to use the service for any unlawful purpose or in any way
            that could damage, disable, overburden, or impair the service. You may not attempt to gain unauthorized
            access to any part of the service or its related systems.
          </p>
        </section>

        <section>
          <h2>7.3 Subscription Plans and Payment</h2>
          <p>
            Preplai offers free and paid subscription plans. Paid plans are billed on a monthly or annual basis
            as selected at the time of purchase. All fees are non-refundable except as required by law. We reserve
            the right to change pricing with 30 days notice. Your subscription will automatically renew unless you
            cancel before the end of your current billing period.
          </p>
        </section>

        <section>
          <h2>7.4 Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are owned by Preplai and are protected
            by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            Presentations you create using Preplai are yours. We do not claim ownership of your content. However,
            you grant us a limited license to host, display, and distribute your presentations as necessary to
            provide the service.
          </p>
        </section>

        <section>
          <h2>7.5 Content Guidelines</h2>
          <p>
            You are solely responsible for the content you create and share through Preplai. You agree not to
            create or distribute content that is illegal, harmful, threatening, abusive, harassing, defamatory,
            vulgar, obscene, or otherwise objectionable. We reserve the right to remove content that violates
            these guidelines and to suspend or terminate accounts of repeat offenders.
          </p>
        </section>

        <section>
          <h2>7.6 Privacy</h2>
          <p>
            Your use of Preplai is also governed by our <Link to="/privacy">Privacy Policy</Link>, which is
            incorporated into these terms by reference. Please review the Privacy Policy to understand our
            practices regarding the collection, use, and disclosure of your personal information.
          </p>
        </section>

        <section>
          <h2>7.7 Service Availability</h2>
          <p>
            We strive to maintain high availability of the service but do not guarantee uninterrupted access.
            The service may be temporarily unavailable due to maintenance, updates, or factors beyond our control.
            We will make reasonable efforts to notify users of planned downtime in advance.
          </p>
        </section>

        <section>
          <h2>7.8 Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Preplai and its affiliates, officers, directors,
            employees, and agents shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages, including but not limited to loss of profits, data, use, or goodwill, arising out
            of or in connection with your use of the service.
          </p>
        </section>

        <section>
          <h2>7.9 Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Preplai and its affiliates from and against any
            claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of
            or in any way connected with your access to or use of the service, your violation of these terms,
            or your violation of any rights of a third party.
          </p>
        </section>

        <section>
          <h2>7.10 Termination</h2>
          <p>
            We may terminate or suspend your account and access to the service immediately, without prior notice
            or liability, for any reason, including if you breach these terms. Upon termination, your right to
            use the service will immediately cease. All provisions of these terms that by their nature should
            survive termination shall survive.
          </p>
        </section>

        <section>
          <h2>7.11 Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of the State of Delaware,
            United States, without regard to its conflict of law provisions. Any disputes arising under these
            terms shall be subject to the exclusive jurisdiction of the courts located in Delaware.
          </p>
        </section>

        <section>
          <h2>7.12 Changes to These Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify you of material changes by
            posting the updated terms on this page and updating the "Last updated" date. Your continued use of
            the service after any changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>7.13 Contact</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us
            at <a href="mailto:legal@preplai.com">legal@preplai.com</a>.
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
