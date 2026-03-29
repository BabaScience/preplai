import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, X, Check } from 'lucide-react';
import { apiRateSession, apiGetSessionRating, apiDeleteSessionRating } from '../lib/api';

export default function SessionRatingWidget({ sessionId }) {
  const [rating, setRating] = useState(null); // 'up' | 'down' | null
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    apiGetSessionRating(sessionId)
      .then((res) => {
        if (res.rating) {
          setRating(res.rating.rating);
          setComment(res.rating.comment || '');
        }
      })
      .catch(() => {});
  }, [sessionId]);

  const handleRate = useCallback(async (value) => {
    if (saving) return;
    if (rating === value) {
      // Toggle off
      setSaving(true);
      try {
        await apiDeleteSessionRating(sessionId);
        setRating(null);
        setComment('');
        setShowComment(false);
      } catch { /* ignore */ }
      setSaving(false);
      return;
    }
    setSaving(true);
    try {
      await apiRateSession(sessionId, value, comment.trim() || null);
      setRating(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch { /* ignore */ }
    setSaving(false);
  }, [sessionId, rating, comment, saving]);

  const handleCommentSubmit = useCallback(async () => {
    if (!rating || saving) return;
    setSaving(true);
    try {
      await apiRateSession(sessionId, rating, comment.trim() || null);
      setSaved(true);
      setShowComment(false);
      setTimeout(() => setSaved(false), 1500);
    } catch { /* ignore */ }
    setSaving(false);
  }, [sessionId, rating, comment, saving]);

  if (!sessionId) return null;

  return (
    <>
      <style>{`
        .sr-widget {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .sr-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--color-border, #CBC9C3);
          background: transparent;
          color: var(--color-text-muted, #6b6c78);
          cursor: pointer;
          transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sr-btn:hover {
          border-color: var(--color-primary, #C9A84C);
          color: var(--color-primary, #C9A84C);
          background: var(--color-primary-highlight, rgba(201,168,76,0.06));
        }
        .sr-btn--up-active {
          background: rgba(67,122,34,0.1);
          border-color: var(--color-success, #437a22);
          color: var(--color-success, #437a22);
        }
        .sr-btn--up-active:hover {
          background: rgba(67,122,34,0.15);
          border-color: var(--color-success, #437a22);
          color: var(--color-success, #437a22);
        }
        .sr-btn--down-active {
          background: rgba(214,69,69,0.1);
          border-color: var(--color-error, #D64545);
          color: var(--color-error, #D64545);
        }
        .sr-btn--down-active:hover {
          background: rgba(214,69,69,0.15);
          border-color: var(--color-error, #D64545);
          color: var(--color-error, #D64545);
        }
        .sr-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .sr-comment-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--color-border, #CBC9C3);
          background: transparent;
          color: var(--color-text-muted, #6b6c78);
          cursor: pointer;
          transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sr-comment-btn:hover {
          border-color: var(--color-primary, #C9A84C);
          color: var(--color-primary, #C9A84C);
        }
        .sr-comment-btn--has-comment {
          color: var(--color-primary, #C9A84C);
          border-color: var(--color-primary, #C9A84C);
        }
        .sr-popover {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: var(--color-surface, #F5F4F1);
          border: 1px solid var(--color-border, #CBC9C3);
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05);
          padding: 14px;
          z-index: 100;
          animation: sr-fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes sr-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sr-popover textarea {
          width: 100%;
          border: 1px solid var(--color-border, #CBC9C3);
          border-radius: 10px;
          background: var(--color-surface-offset, #F2F1EE);
          padding: 10px 12px;
          font-size: 13px;
          font-family: var(--font-body, 'Inter', sans-serif);
          color: var(--color-text, #1a1b24);
          resize: none;
          outline: none;
          box-sizing: border-box;
          transition: border-color 180ms;
          line-height: 1.5;
        }
        .sr-popover textarea:focus {
          border-color: var(--color-primary, #C9A84C);
        }
        .sr-popover textarea::placeholder {
          color: var(--color-text-faint, #a0a1aa);
        }
        .sr-popover-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }
        .sr-popover-save {
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          background: var(--color-primary, #C9A84C);
          color: var(--color-text-inverse, #fff);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 180ms;
        }
        .sr-popover-save:hover { background: var(--color-primary-hover, #A3822A); }
        .sr-popover-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .sr-popover-cancel {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #CBC9C3);
          background: transparent;
          color: var(--color-text-muted, #6b6c78);
          font-size: 12px;
          cursor: pointer;
          transition: border-color 180ms, color 180ms;
        }
        .sr-popover-cancel:hover {
          border-color: var(--color-text-muted, #6b6c78);
          color: var(--color-text, #1a1b24);
        }
        .sr-saved {
          font-size: 12px;
          color: var(--color-success, #437a22);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          animation: sr-fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <div className="sr-widget" style={{ position: 'relative' }}>
        <button
          className={`sr-btn${rating === 'up' ? ' sr-btn--up-active' : ''}`}
          onClick={() => handleRate('up')}
          disabled={saving}
          aria-label="Thumbs up"
          title="Helpful"
        >
          <ThumbsUp size={16} />
        </button>
        <button
          className={`sr-btn${rating === 'down' ? ' sr-btn--down-active' : ''}`}
          onClick={() => handleRate('down')}
          disabled={saving}
          aria-label="Thumbs down"
          title="Not helpful"
        >
          <ThumbsDown size={16} />
        </button>
        {rating && (
          <button
            className={`sr-comment-btn${comment ? ' sr-comment-btn--has-comment' : ''}`}
            onClick={() => setShowComment(!showComment)}
            aria-label="Add comment"
            title="Add a comment"
          >
            <MessageCircle size={16} />
          </button>
        )}
        {saved && (
          <span className="sr-saved">
            <Check size={14} /> Saved
          </span>
        )}

        {showComment && (
          <div className="sr-popover">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more (optional)..."
              rows={3}
              maxLength={1000}
            />
            <div className="sr-popover-actions">
              <button className="sr-popover-cancel" onClick={() => setShowComment(false)}>
                Cancel
              </button>
              <button
                className="sr-popover-save"
                onClick={handleCommentSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
