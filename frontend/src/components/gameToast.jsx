import { toast } from 'react-toastify';
import {
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const baseConfig = {
  hideProgressBar: true,
  closeButton: false,
  className: 'game-toast',
  bodyClassName: 'game-toast-body',
};

export const gameToast = {
  success: (message, options) =>
    toast(
      <div className="game-toast-content success">
        <div className="toast-icon success-icon">
          <CheckCircle2 size={22} />
        </div>

        <div className="toast-text-group">
          <span className="toast-title">BERHASIL</span>
          <span className="toast-message">{message}</span>
        </div>
      </div>,
      {
        ...baseConfig,
        ...options,
      }
    ),

  error: (message, options) =>
    toast(
      <div className="game-toast-content error">
        <div className="toast-icon error-icon">
          <XCircle size={22} />
        </div>

        <div className="toast-text-group">
          <span className="toast-title">GAGAL</span>
          <span className="toast-message">{message}</span>
        </div>
      </div>,
      {
        ...baseConfig,
        ...options,
      }
    ),

  info: (message, options) =>
    toast(
      <div className="game-toast-content info">
        <div className="toast-icon info-icon">
          <Info size={22} />
        </div>

        <div className="toast-text-group">
          <span className="toast-title">INFO</span>
          <span className="toast-message">{message}</span>
        </div>
      </div>,
      {
        ...baseConfig,
        ...options,
      }
    ),

  xp: (xpAmount, title, options) => {
    const isGain = xpAmount >= 0;
    const displayAmount = Math.abs(xpAmount);

    return toast(
      <div className={`game-toast-content xp ${isGain ? 'xp-gain' : 'xp-loss'}`}>
        <div className={`toast-icon ${isGain ? 'xp-gain-icon' : 'xp-loss-icon'}`}>
          {isGain ? <TrendingUp size={24} /> : <TrendingDown size={24} />}</div>

        <div className="toast-text-group">
          <span className="toast-title">{title}</span>
          <span className="toast-message">{isGain ? '+' : '-'}{displayAmount} Poin</span>
        </div>
      </div>,
      {
        ...baseConfig, 
        ...options,
      }
    );
  },
};