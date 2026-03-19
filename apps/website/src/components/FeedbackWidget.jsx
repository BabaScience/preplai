import { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, X, Check, ImagePlus } from 'lucide-react';
import { apiSubmitFeedback } from '../lib/api';

const TYPES = ['bug', 'feature', 'other'];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [pulsed, setPulsed] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const panelRef = useRef(null);
  const fileInputRef = useRef(null);

  /* Pulse the trigger once on first mount to draw attention */
  useEffect(() => {
    const timer = setTimeout(() => setPulsed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSending(true);
    try {
      await apiSubmitFeedback({
        type,
        description,
        pageUrl: window.location.href,
        browserInfo: navigator.userAgent,
        imageData,
      });
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setDescription('');
        setImageData(null);
        setImagePreview(null);
      }, 2400);
    } catch {
      alert('Failed to submit feedback');
    } finally {
      setSending(false);
    }
  };

  const isDisabled = sending || !description.trim();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageData(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {/* --- Scoped styles --- */}
      <style>{`
        @keyframes fw-pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(201,168,76,0.35); }
          50%       { box-shadow: 0 4px 24px rgba(201,168,76,0.6); }
        }
        @keyframes fw-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fw-slide-down {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(16px) scale(0.96); }
        }
        @keyframes fw-checkmark {
          0%   { transform: scale(0); opacity: 0; }
          50%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .fw-trigger {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--color-primary, #C9A84C);
          color: var(--color-text-inverse, #fff);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(201,168,76,0.35);
          z-index: 9999;
          transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fw-trigger:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(201,168,76,0.5);
        }
        .fw-trigger:active {
          transform: scale(0.96);
        }
        .fw-trigger--pulse {
          animation: fw-pulse 2s ease-in-out 2;
        }
        .fw-panel {
          position: fixed;
          bottom: 88px;
          right: 24px;
          width: 340px;
          max-height: 440px;
          background: color-mix(in srgb, var(--color-surface, #F5F4F1) 85%, transparent);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid var(--color-border, #CBC9C3);
          border-top: 3px solid var(--color-primary, #C9A84C);
          box-shadow: 0 16px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transform-origin: bottom right;
        }
        .fw-panel--enter {
          animation: fw-slide-up 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .fw-panel--exit {
          animation: fw-slide-down 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .fw-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--color-divider, #D8D6D1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fw-header-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text, #1a1b24);
          letter-spacing: -0.01em;
        }
        .fw-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-faint, #a0a1aa);
          padding: 4px;
          display: flex;
          border-radius: var(--radius-sm, 6px);
          transition: color 150ms, background 150ms;
        }
        .fw-close:hover {
          color: var(--color-text, #1a1b24);
          background: var(--color-surface-dynamic, #E5E3DF);
        }
        .fw-form {
          padding: 18px 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .fw-pills {
          display: flex;
          gap: 8px;
        }
        .fw-pill {
          padding: 6px 16px;
          border-radius: var(--radius-full, 9999px);
          border: 1px solid var(--color-border, #CBC9C3);
          background: transparent;
          color: var(--color-text-muted, #6b6c78);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          text-transform: capitalize;
          transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
          font-family: var(--font-body, 'Inter', sans-serif);
        }
        .fw-pill:hover {
          border-color: var(--color-primary, #C9A84C);
          color: var(--color-primary, #C9A84C);
        }
        .fw-pill--active {
          background: var(--color-primary, #C9A84C);
          border-color: var(--color-primary, #C9A84C);
          color: var(--color-text-inverse, #fff);
        }
        .fw-pill--active:hover {
          background: var(--color-primary-hover, #A3822A);
          border-color: var(--color-primary-hover, #A3822A);
          color: var(--color-text-inverse, #fff);
        }
        .fw-textarea {
          width: 100%;
          border-radius: var(--radius-lg, 12px);
          border: 1px solid var(--color-border, #CBC9C3);
          background: var(--color-surface-offset, #F2F1EE);
          padding: 12px 14px;
          font-size: 13px;
          font-family: var(--font-body, 'Inter', sans-serif);
          color: var(--color-text, #1a1b24);
          resize: vertical;
          box-sizing: border-box;
          transition: border-color 180ms, box-shadow 180ms;
          outline: none;
          line-height: 1.5;
        }
        .fw-textarea::placeholder {
          color: var(--color-text-faint, #a0a1aa);
        }
        .fw-textarea:focus {
          border-color: var(--color-primary, #C9A84C);
          box-shadow: 0 0 0 3px var(--color-primary-highlight, rgba(201,168,76,0.1));
        }
        .fw-submit {
          padding: 11px 0;
          border-radius: var(--radius-lg, 12px);
          border: none;
          background: var(--color-primary, #C9A84C);
          color: var(--color-text-inverse, #fff);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 180ms, transform 180ms, box-shadow 180ms;
          font-family: var(--font-body, 'Inter', sans-serif);
        }
        .fw-submit:hover:not(:disabled) {
          background: var(--color-primary-hover, #A3822A);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08));
        }
        .fw-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .fw-submit:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .fw-success {
          padding: 48px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .fw-success-check {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-success-highlight, rgba(67,122,34,0.08));
          color: var(--color-success, #437a22);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fw-checkmark 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .fw-success-text {
          font-family: var(--font-display, 'Instrument Serif', serif);
          font-style: italic;
          font-size: 20px;
          color: var(--color-text, #1a1b24);
        }
        .fw-image-area {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .fw-image-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: var(--radius-lg, 12px);
          border: 1px dashed var(--color-border, #CBC9C3);
          background: transparent;
          color: var(--color-text-muted, #6b6c78);
          font-size: 12px;
          cursor: pointer;
          transition: border-color 180ms, color 180ms, background 180ms;
        }
        .fw-image-label:hover {
          border-color: var(--color-primary, #C9A84C);
          color: var(--color-primary, #C9A84C);
          background: var(--color-primary-highlight, rgba(201,168,76,0.06));
        }
        .fw-image-preview {
          position: relative;
          display: inline-flex;
        }
        .fw-image-thumb {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid var(--color-border, #CBC9C3);
        }
        .fw-image-remove {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-error, #D64545);
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          line-height: 1;
          padding: 0;
        }
      `}</style>

      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Send feedback"
        className={`fw-trigger${!pulsed ? '' : !open ? ' fw-trigger--pulse' : ''}`}
      >
        {open ? <X size={20} /> : <MessageSquarePlus size={20} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="fw-panel fw-panel--enter"
        >
          {/* Header */}
          <div className="fw-header">
            <span className="fw-header-title">Send Feedback</span>
            <button
              onClick={() => setOpen(false)}
              className="fw-close"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {sent ? (
            <div className="fw-success">
              <div className="fw-success-check">
                <Check size={24} strokeWidth={2.5} />
              </div>
              <span className="fw-success-text">Thank you!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="fw-form">
              {/* Type pills */}
              <div className="fw-pills">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`fw-pill${type === t ? ' fw-pill--active' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your feedback..."
                rows={4}
                required
                className="fw-textarea"
              />

              {/* Image upload */}
              <div className="fw-image-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {!imagePreview ? (
                  <label className="fw-image-label" onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus size={14} />
                    Attach screenshot
                  </label>
                ) : (
                  <div className="fw-image-preview">
                    <img src={imagePreview} alt="Preview" className="fw-image-thumb" />
                    <button type="button" className="fw-image-remove" onClick={removeImage}>&times;</button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isDisabled}
                className="fw-submit"
              >
                {sending ? 'Sending...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
