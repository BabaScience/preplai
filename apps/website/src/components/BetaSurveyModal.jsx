import { useState, useEffect, useCallback } from 'react';
import { X, Star, Check, ArrowRight } from 'lucide-react';
import { apiGetSurveyStatus, apiSubmitSurvey } from '../lib/api';

const QUESTIONS = [
  { key: 'overallExperience', label: 'How would you rate your overall experience with Preplai?', type: 'stars' },
  { key: 'easeOfUse', label: 'How easy was it to create visual presentations?', type: 'stars' },
  { key: 'visualQuality', label: 'How would you rate the visual quality of the output?', type: 'stars' },
  { key: 'wouldRecommend', label: 'Would you recommend Preplai to a colleague?', type: 'choice', options: ['yes', 'maybe', 'no'] },
  { key: 'openFeedback', label: 'Any other feedback or suggestions?', type: 'text' },
];

const CHOICE_LABELS = { yes: 'Yes, definitely', maybe: 'Maybe', no: 'Not yet' };

export default function BetaSurveyModal() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this browser session
    if (sessionStorage.getItem('preplai_survey_dismissed')) return;

    apiGetSurveyStatus()
      .then((res) => {
        if (res.shouldShow && !res.completed) {
          // Delay appearance for a smooth UX
          setTimeout(() => setVisible(true), 2000);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem('preplai_survey_dismissed', '1');
    setTimeout(() => setVisible(false), 300);
  }, []);

  const handleAnswer = useCallback((key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canProceed = useCallback(() => {
    const q = QUESTIONS[step];
    if (q.type === 'text') return true; // optional
    return answers[q.key] != null;
  }, [step, answers]);

  const handleNext = useCallback(async () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setSubmitting(true);
      try {
        await apiSubmitSurvey(answers);
        setSubmitted(true);
        setTimeout(() => {
          dismiss();
        }, 2500);
      } catch {
        alert('Failed to submit survey. Please try again.');
      }
      setSubmitting(false);
    }
  }, [step, answers, dismiss]);

  if (!visible) return null;

  const q = QUESTIONS[step];

  return (
    <>
      <style>{`
        .bs-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bs-overlay-in 300ms ease;
        }
        .bs-overlay--exit {
          animation: bs-overlay-out 300ms ease forwards;
        }
        @keyframes bs-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bs-overlay-out { from { opacity: 1; } to { opacity: 0; } }

        .bs-modal {
          width: 420px;
          max-width: 90vw;
          background: var(--color-surface, #F5F4F1);
          border-radius: 20px;
          border: 1px solid var(--color-border, #CBC9C3);
          box-shadow: 0 24px 80px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);
          overflow: hidden;
          animation: bs-modal-in 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bs-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .bs-header {
          padding: 20px 24px 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .bs-badge {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--color-primary-highlight, rgba(201,168,76,0.1));
          color: var(--color-primary, #C9A84C);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .bs-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-faint, #a0a1aa);
          padding: 4px;
          display: flex;
          border-radius: 8px;
          transition: color 150ms, background 150ms;
        }
        .bs-close:hover {
          color: var(--color-text, #1a1b24);
          background: var(--color-surface-dynamic, #E5E3DF);
        }

        .bs-body {
          padding: 20px 24px 24px;
        }
        .bs-progress {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
        }
        .bs-progress-dot {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: var(--color-border, #CBC9C3);
          transition: background 300ms;
        }
        .bs-progress-dot--active {
          background: var(--color-primary, #C9A84C);
        }
        .bs-progress-dot--done {
          background: var(--color-success, #437a22);
        }

        .bs-question {
          font-size: 16px;
          font-weight: 500;
          color: var(--color-text, #1a1b24);
          line-height: 1.4;
          margin-bottom: 20px;
        }

        .bs-stars {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .bs-star {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid var(--color-border, #CBC9C3);
          background: transparent;
          color: var(--color-text-muted, #6b6c78);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bs-star:hover {
          border-color: var(--color-primary, #C9A84C);
          color: var(--color-primary, #C9A84C);
          transform: scale(1.08);
        }
        .bs-star--active {
          background: var(--color-primary, #C9A84C);
          border-color: var(--color-primary, #C9A84C);
          color: #fff;
        }
        .bs-star--active:hover {
          background: var(--color-primary-hover, #A3822A);
          border-color: var(--color-primary-hover, #A3822A);
          color: #fff;
        }

        .bs-choices {
          display: flex;
          gap: 8px;
        }
        .bs-choice {
          flex: 1;
          padding: 12px 8px;
          border-radius: 12px;
          border: 1px solid var(--color-border, #CBC9C3);
          background: transparent;
          color: var(--color-text-muted, #6b6c78);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
          font-family: var(--font-body, 'Inter', sans-serif);
        }
        .bs-choice:hover {
          border-color: var(--color-primary, #C9A84C);
          color: var(--color-primary, #C9A84C);
        }
        .bs-choice--active {
          background: var(--color-primary, #C9A84C);
          border-color: var(--color-primary, #C9A84C);
          color: #fff;
        }

        .bs-textarea {
          width: 100%;
          border: 1px solid var(--color-border, #CBC9C3);
          border-radius: 12px;
          background: var(--color-surface-offset, #F2F1EE);
          padding: 12px 14px;
          font-size: 14px;
          font-family: var(--font-body, 'Inter', sans-serif);
          color: var(--color-text, #1a1b24);
          resize: none;
          outline: none;
          box-sizing: border-box;
          transition: border-color 180ms;
          line-height: 1.5;
        }
        .bs-textarea:focus {
          border-color: var(--color-primary, #C9A84C);
        }
        .bs-textarea::placeholder {
          color: var(--color-text-faint, #a0a1aa);
        }

        .bs-footer {
          padding: 0 24px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bs-skip {
          background: none;
          border: none;
          color: var(--color-text-faint, #a0a1aa);
          font-size: 13px;
          cursor: pointer;
          padding: 6px 0;
          transition: color 150ms;
        }
        .bs-skip:hover { color: var(--color-text-muted, #6b6c78); }

        .bs-next {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          background: var(--color-primary, #C9A84C);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 180ms, transform 180ms;
          font-family: var(--font-body, 'Inter', sans-serif);
        }
        .bs-next:hover:not(:disabled) {
          background: var(--color-primary-hover, #A3822A);
          transform: translateY(-1px);
        }
        .bs-next:disabled { opacity: 0.45; cursor: not-allowed; }

        .bs-success {
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .bs-success-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(67,122,34,0.1);
          color: var(--color-success, #437a22);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bs-check-in 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bs-check-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .bs-success-title {
          font-family: var(--font-display, 'Instrument Serif', serif);
          font-style: italic;
          font-size: 22px;
          color: var(--color-text, #1a1b24);
        }
        .bs-success-sub {
          font-size: 14px;
          color: var(--color-text-muted, #6b6c78);
        }
      `}</style>

      <div
        className={`bs-overlay${dismissed ? ' bs-overlay--exit' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Beta feedback survey"
      >
        <div className="bs-modal">
          {submitted ? (
            <div className="bs-success">
              <div className="bs-success-icon">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <div className="bs-success-title">Thank you!</div>
              <div className="bs-success-sub">Your feedback helps us build a better product.</div>
            </div>
          ) : (
            <>
              <div className="bs-header">
                <span className="bs-badge">Beta Feedback</span>
                <button className="bs-close" onClick={dismiss} aria-label="Close survey">
                  <X size={18} />
                </button>
              </div>

              <div className="bs-body">
                {/* Progress dots */}
                <div className="bs-progress">
                  {QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={`bs-progress-dot${i === step ? ' bs-progress-dot--active' : ''}${i < step ? ' bs-progress-dot--done' : ''}`}
                    />
                  ))}
                </div>

                {/* Question */}
                <div className="bs-question">{q.label}</div>

                {/* Answer input */}
                {q.type === 'stars' && (
                  <div className="bs-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        className={`bs-star${answers[q.key] >= n ? ' bs-star--active' : ''}`}
                        onClick={() => handleAnswer(q.key, n)}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      >
                        <Star size={20} fill={answers[q.key] >= n ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'choice' && (
                  <div className="bs-choices">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        className={`bs-choice${answers[q.key] === opt ? ' bs-choice--active' : ''}`}
                        onClick={() => handleAnswer(q.key, opt)}
                      >
                        {CHOICE_LABELS[opt] || opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'text' && (
                  <textarea
                    className="bs-textarea"
                    value={answers[q.key] || ''}
                    onChange={(e) => handleAnswer(q.key, e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    maxLength={2000}
                  />
                )}
              </div>

              <div className="bs-footer">
                <button className="bs-skip" onClick={dismiss}>
                  Maybe later
                </button>
                <button
                  className="bs-next"
                  onClick={handleNext}
                  disabled={!canProceed() || submitting}
                >
                  {submitting
                    ? 'Submitting...'
                    : step === QUESTIONS.length - 1
                      ? 'Submit'
                      : <>Next <ArrowRight size={16} /></>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
