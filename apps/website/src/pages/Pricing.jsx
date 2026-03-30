import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import LandingLayout from '../layouts/LandingLayout';
import Logo from '../components/Logo';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'For individuals getting started with visual AI.',
    features: [
      'Up to 5 presentations',
      'Unlimited scenes per presentation',
      'No voice narration',
      'Preplai watermark',
      'Shareable links',
      'Community support',
    ],
    cta: 'Get started free',
    ctaTo: '/signup',
    highlighted: false,
  },
  {
    name: 'Creator',
    price: '$19',
    period: '/mo',
    description: 'For creators who present regularly.',
    features: [
      '50 presentations / month',
      'Voice narration',
      'No watermark',
      'Shareable + embeddable',
      'Email support',
    ],
    cta: 'Start Creator plan',
    ctaTo: '/signup',
    highlighted: false,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/mo',
    description: 'For teams that collaborate and share.',
    features: [
      'Unlimited presentations',
      'Voice narration',
      'Custom branding',
      'Team sharing + analytics',
      'Priority support',
    ],
    cta: 'Start Team plan',
    ctaTo: '/signup',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations with advanced needs.',
    features: [
      'Unlimited presentations',
      'Voice + custom voice',
      'White-label',
      'SSO / SAML + audit logs',
      'Dedicated CSM + SLA',
    ],
    cta: 'Contact sales',
    ctaTo: 'mailto:sales@preplai.com',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. You can upgrade, downgrade, or cancel your plan at any time from your dashboard. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'What counts as a presentation?',
    a: 'A presentation is a single session created through the Preplai MCP. Each session can contain multiple frames and scenes. Viewing and sharing a presentation does not count against your limit.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes. Annual plans are available at a 20% discount. Contact us or select annual billing during checkout.',
  },
  {
    q: 'What happens when I hit my presentation limit?',
    a: 'You will not be able to create new presentations until you delete an existing one. On the Free plan, you can have up to 5 presentations at a time — delete any to free up a slot. Existing presentations remain accessible and shareable. You can upgrade your plan at any time for more presentations.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'The Free plan lets you try Preplai with no time limit. For paid features like voice narration and custom branding, we offer a 14-day free trial on the Creator and Team plans.',
  },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button
        className="faq-question"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{question}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="faq-answer"><p>{answer}</p></div>}
    </div>
  );
}

export default function Pricing() {
  return (
    <LandingLayout>
      {/* Hero */}
      <section className="section-block pricing-hero" style={{ borderTop: 'none', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--text-4xl, 2.5rem)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          Simple pricing. Start free.
        </h1>
        <p className="section-desc" style={{ maxWidth: '540px', margin: '0 auto' }}>
          Every plan includes the full Preplai engine. Upgrade when you need more.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="section-block" style={{ borderTop: 'none' }}>
        <div className="pricing-grid">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bento-card pricing-card${tier.highlighted ? ' pricing-card-highlighted' : ''}`}
            >
              {tier.highlighted && <div className="pricing-badge">Most popular</div>}
              <h3 className="pricing-tier-name">{tier.name}</h3>
              <div className="pricing-price">
                <span className="pricing-amount">{tier.price}</span>
                {tier.period && <span className="pricing-period">{tier.period}</span>}
              </div>
              <p className="pricing-description">{tier.description}</p>
              <ul className="pricing-features">
                {tier.features.map((f, i) => (
                  <li key={i}>
                    <Check size={16} className="pricing-check" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {tier.ctaTo.startsWith('mailto:') ? (
                <a href={tier.ctaTo} className={`btn ${tier.highlighted ? 'btn-primary' : 'btn-ghost'} pricing-cta`}>
                  {tier.cta}
                </a>
              ) : (
                <Link to={tier.ctaTo} className={`btn ${tier.highlighted ? 'btn-primary' : 'btn-ghost'} pricing-cta`}>
                  {tier.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">FAQ</div>
        <h2 style={{ textAlign: 'center' }}>Frequently asked questions</h2>
        <div className="faq-list">
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

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
              <Link to="/docs">Docs</Link>
              <Link to="/pricing">Pricing</Link>
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
