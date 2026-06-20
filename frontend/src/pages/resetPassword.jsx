import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { gameToast } from '../components/gameToast';
import { ArrowLeft, Copy, Check } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState('request');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrors([]);

    const newErrors = [];
    if (!email) newErrors.push('Email wajib diisi');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.push('Format email tidak valid');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });

      setNewPassword(res.data.newPassword || '');
      setStep('sent');
      gameToast.success('Password berhasil direset');

    } catch (err) {
      if (err.response) {
        const { code, message } = err.response.data;

        if (code === 'INVALID_EMAIL' || code === 'FIELD_MISSING') {
          setErrors([message]);
        } else if (code === 'SERVER_ERROR') {
          gameToast.error('Server bermasalah, coba lagi nanti', { toastId: code });
        } else {
          gameToast.error(message || 'Terjadi kesalahan', { toastId: code });
        }

      } else if (err.request) {
        gameToast.error('Tidak bisa terhubung ke server');
      } else {
        gameToast.error('Terjadi kesalahan pada client');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="auth-page d-flex justify-content-center align-items-center px-4 py-5">
      <div className="card shadow-lg p-4 rounded-4 w-100">
        <div className="text-center mb-4">
          <img
            src="/goihuntlogo.svg"
            alt="GoiHunt Logo"
            className="img-fluid"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        <div className="mb-3 pb-3 border-bottom border-2">
          <button
            type="button"
            className="btn mt-2 p-0 btn-link text-decoration-none text-muted d-flex align-items-center w-100"
            onClick={() => navigate('/auth')}
            disabled={loading}
          >
            <ArrowLeft size={18} className="me-2" />
            <span>Kembali ke Login</span>
          </button>
        </div>

        <h5 className="text-center fw-bold mb-3">Reset Password</h5>

        {/* FORM INPUT EMAIL */}
        {step === 'request' && (
          <form onSubmit={handleRequestReset} noValidate>
            <input
              type="email"
              className="form-control mb-3"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            {errors.length > 0 && (
              <div className="mb-3 text-danger">
                {errors.map((err, i) => (
                  <p className="mb-0" key={i}>{err}</p>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 btn-lg"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* TAMPILKAN PASSWORD BARU */}
        {step === 'sent' && (
          <div className="text-center">
            {newPassword ? (
              <>
                <p className="mb-2">Password baru untuk <strong>{email}</strong>:</p>

                <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                  <code className="fs-5 bg-light px-3 py-2 rounded border fw-bold">
                    {newPassword}
                  </code>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleCopy}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <p className="text-warning small mb-4">
                  ⚠️ Segera ubah password kamu setelah login!
                </p>
              </>
            ) : (
              <p className="mb-4 text-muted">
                Jika email <strong>{email}</strong> terdaftar, password telah direset. Silakan coba login.
              </p>
            )}

            <button
              className="btn btn-primary w-100 btn-lg"
              onClick={() => navigate('/auth')}
            >
              Ke Halaman Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
