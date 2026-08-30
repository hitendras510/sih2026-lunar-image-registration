import React from 'react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warn':
        return '!';
      case 'error':
        return '✕';
      default:
        return '◆';
    }
  };

  return (
    <div id="toasts">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          onClick={() => removeToast(t.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="t-ic">{getIcon(t.type)}</div>
          <div>
            <div className="t-title">{t.title}</div>
            <div className="t-msg">{t.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
