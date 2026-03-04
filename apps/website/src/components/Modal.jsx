import { useEffect, useCallback } from 'react';
import { useSound } from '../context/SoundContext';

export default function Modal({ open, onClose, title, children }) {
  const { playSound } = useSound();

  useEffect(() => {
    if (!open) return;
    playSound('modal-open');
  }, [open, playSound]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && handleClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  const handleClose = useCallback(() => {
    playSound('modal-close');
    onClose();
  }, [playSound, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={handleClose}>&times;</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
