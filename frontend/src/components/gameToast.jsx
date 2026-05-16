import { toast } from 'react-toastify';
import {
  CheckCircle2,
  XCircle,
  Info,
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
          <span className="toast-title">SUCCESS</span>
          <span className="toast-message">{message}</span>
        </div>
      </div>,
      {
        ...baseConfig,
        ...options,
      }
    ),

  error: (message) =>
    toast(
      <div className="game-toast-content error">
        <div className="toast-icon error-icon">
          <XCircle size={22} />
        </div>

        <div className="toast-text-group">
          <span className="toast-title">ERROR</span>
          <span className="toast-message">{message}</span>
        </div>
      </div>,
      {
        ...baseConfig,
      }
    ),

  info: (message) =>
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
      }
    ),
};