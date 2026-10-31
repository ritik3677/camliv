import React, { useEffect } from 'react';

export default function Toast({ message, onDismiss, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, onDismiss, duration]);

  if (!message) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className="toast">
        <span aria-hidden="true">✓</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
