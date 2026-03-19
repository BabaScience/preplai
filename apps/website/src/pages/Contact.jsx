import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import LandingLayout from '../layouts/LandingLayout';
import Input from '../components/Input';
import Alert from '../components/Alert';
import { apiSubmitContact } from '../lib/api';

const USE_CASES = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'integration', label: 'Custom Integration' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'support', label: 'Support' },
  { value: 'other', label: 'Other' },
];

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [useCase, setUseCase] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiSubmitContact({ name, email, company, useCase, message });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LandingLayout>
      <style>{`
        @keyframes contact-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes contact-checkmark {
          0%   { transform: scale(0); opacity: 0; }
          50%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .contact-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: var(--space-10);
          width: min(560px, 100%);
          animation: contact-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }
        .contact-select-wrapper {
          position: relative;
        }
        .contact-select {
          appearance: none;
          -webkit-appearance: none;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-10) var(--space-3) var(--space-4);
          font-family: var(--font-body);
          font-size: var(--text-base);
          color: var(--color-text);
          width: 100%;
          cursor: pointer;
          transition: border-color var(--transition-interactive), box-shadow var(--transition-interactive);
          outline: none;
        }
        .contact-select:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-highlight);
        }
        .contact-select option[value=""][disabled] {
          color: var(--color-text-faint);
        }
        .contact-select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: var(--color-text-faint);
        }
        .contact-textarea {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          font-family: var(--font-body);
          font-size: var(--text-base);
          color: var(--color-text);
          width: 100%;
          resize: vertical;
          transition: border-color var(--transition-interactive), box-shadow var(--transition-interactive);
          outline: none;
          box-sizing: border-box;
          line-height: 1.6;
        }
        .contact-textarea::placeholder { color: var(--color-text-faint); }
        .contact-textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-highlight);
        }
        .contact-submit {
          width: 100%;
          padding: var(--space-4) var(--space-8);
          border-radius: var(--radius-md);
          border: none;
          background: var(--color-primary);
          color: var(--color-text-inverse);
          font-family: var(--font-body);
          font-size: var(--text-base);
          font-weight: 600;
          cursor: pointer;
          transition: background var(--transition-interactive),
                      transform var(--transition-interactive),
                      box-shadow var(--transition-interactive);
        }
        .contact-submit:hover:not(:disabled) {
          background: var(--color-primary-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        .contact-submit:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: var(--shadow-sm);
        }
        .contact-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .contact-success {
          text-align: center;
          padding: var(--space-12) var(--space-10);
          animation: contact-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .contact-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--color-success-highlight);
          color: var(--color-success);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-5);
          animation: contact-checkmark 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .contact-success h2 {
          font-family: var(--font-display);
          font-style: italic;
          font-size: var(--text-xl);
          margin-bottom: var(--space-3);
          color: var(--color-text);
        }
      `}</style>

      <section className="section-block" style={{ borderTop: 'none', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div className="section-label">Get In Touch</div>
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)' }}>Contact Us</h1>
            <p style={{ color: 'var(--color-text-faint)', maxWidth: 420, margin: '0 auto', lineHeight: 'var(--line-height-relaxed)' }}>
              Have a question about Preplai? Want to explore enterprise plans or a custom integration? We would love to hear from you.
            </p>
          </div>

          {sent ? (
            <div className="contact-card contact-success">
              <div className="contact-success-icon">
                <Check size={32} strokeWidth={2.5} />
              </div>
              <h2>Message Sent</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', lineHeight: 'var(--line-height-relaxed)' }}>
                Thank you for reaching out. We will get back to you within 1-2 business days.
              </p>
              <Link to="/" className="btn btn-primary btn-lg">Back to home</Link>
            </div>
          ) : (
            <div className="contact-card">
              <Alert variant="error">{error}</Alert>
              <form className="contact-form" onSubmit={handleSubmit}>
                <Input
                  label="Name"
                  id="contact-name"
                  type="text"
                  placeholder="Your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="Email"
                  id="contact-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Company (optional)"
                  id="contact-company"
                  type="text"
                  placeholder="Your company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
                <div className="form-group">
                  <label htmlFor="contact-usecase" className="form-label">Use Case</label>
                  <div className="contact-select-wrapper">
                    <select
                      id="contact-usecase"
                      className="contact-select"
                      required
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                    >
                      <option value="" disabled>Select a use case</option>
                      {USE_CASES.map((uc) => (
                        <option key={uc.value} value={uc.value}>{uc.label}</option>
                      ))}
                    </select>
                    <svg className="contact-select-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="contact-message" className="form-label">Message</label>
                  <textarea
                    id="contact-message"
                    className="contact-textarea"
                    placeholder="Tell us about your needs..."
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="contact-submit"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <Link to="/" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)', transition: 'color 180ms' }}>
              &larr; Back to home
            </Link>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
