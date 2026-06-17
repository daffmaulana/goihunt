import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { gameToast } from '../components/gameToast';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function resetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [step, setStep] = useState(token ? 'reset' : 'request');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      await api.post('/auth/forgot-password', { email });

      setStep('sent');

      gameToast.success('Permintaan reset password diterima');

    } catch (err) {
      setLoading(false);

      if (err.response) {
        const { code, message } = err.response.data;

        if (code === 'INVALID_EMAIL') {
          setErrors([message]);
          return;
        }

        if (code === 'SERVER_ERROR') {
          gameToast.error('Server bermasalah, coba lagi nanti', { toastId: code });
          return;
        }

        gameToast.error(message || 'Terjadi kesalahan', { toastId: code });

      } else if (err.request) {
        gameToast.error('Tidak bisa terhubung ke server');
      } else {
        gameToast.error('Terjadi kesalahan pada client');
      }
    } finally {
    setLoading(false); 
    setErrors([]);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (loading) return;

    setErrors([]);

    const newErrors = [];

    if (!newPassword) newErrors.push('Password wajib diisi');
    if (!confirmPassword) newErrors.push('Konfirmasi password wajib diisi');

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.push('Konfirmasi password tidak cocok');
    }

    if (newPassword && newPassword.length < 8) {
      newErrors.push('Password minimal 8 karakter');
    }

    if (newPassword && !/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword)) {
      newErrors.push('Password harus mengandung huruf dan angka');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword
      });

      gameToast.success('Password berhasil diubah', {
        onClose: () => navigate('/auth')
      });

    } catch (err) {
      setLoading(false);

      if (err.response) {
        const { code, message } = err.response.data;

        const validationCodes = [
          'FIELD_MISSING',
          'PASSWORD_MISMATCH',
          'WEAK_PASSWORD'
        ];

        if (validationCodes.includes(code)) {
          setErrors([message]);
          return;
        }

        if (code === 'INVALID_TOKEN') {
          gameToast.error('Link reset tidak valid atau sudah expired', { toastId: code });
          return;
        }

        if (code === 'SERVER_ERROR') {
          gameToast.error('Server sedang bermasalah', { toastId: code });
          return;
        }

        gameToast.error(message || 'Terjadi kesalahan', { toastId: code });

      } else if (err.request) {
        gameToast.error('Tidak bisa terhubung ke server');
      } else {
        gameToast.error('Terjadi kesalahan pada client');
      }
    }
  };

  return (
    <div className="auth-page d-flex justify-content-center align-items-center px-4 py-5">
      <div className="card shadow-lg p-4 rounded-4 w-100 ">
        <div className="text-center mb-4">
          <img 
            src="/goihuntlogo.svg" 
            alt="GoiHunt Logo"
            className="img-fluid"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {step !== 'reset' && (
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
        )}

        <h5 className="text-center fw-bold mb-3">Reset Password</h5>
        
        {/* PERMINTAAN RESET */}
        {step === 'request' && (
          <form onSubmit={handleRequestReset} noValidate>
            <input
              type="email"
              className="form-control mb-3"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />

            {errors.length > 0 && (
              <div className="mb-3 text-danger">
                {errors.map((err, i) => (
                  <p className='mb-0' key={i}>{err}</p>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 btn-lg"
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Kirim Permintaan Reset'}
            </button>
          </form>
        )}

        {step === 'sent' && (
          <div className="text-center">
            <p className="mb-3">
              Jika email {email} terdaftar, silahkan cek kotak masuk untuk link reset password
            </p>

            <button
              className="btn btn-primary w-100 btn-lg"
              onClick={() => setStep('request')}
            >
              Kirim Ulang
            </button>
          </div>
        )}

       {/* TOKEN DIDAPAT DAN SUBMIT PASS BARU */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword}>
            
            <div className="position-relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Password baru"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="btn btn-sm position-absolute end-0 top-50 translate-middle-y me-2 border-0"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <input
              type="password"
              className="form-control mb-3"
              placeholder="Konfirmasi password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            {errors.length > 0 && (
              <div className="mb-3 text-danger">
                {errors.map((err, i) => (
                  <p className='mb-0' key={i}>{err}</p>
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
      </div>
    </div>
  );
}