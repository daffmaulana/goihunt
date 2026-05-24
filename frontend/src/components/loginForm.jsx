// Form login di halaman auth

import { useState } from 'react';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { gameToast } from './gameToast';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (loading) return;

    const newErrors = [];

    if (!identifier) newErrors.push('Email atau username wajib diisi');
    if (!password) newErrors.push('Password wajib diisi');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        identifier,
        password
      });
      
      localStorage.setItem('accessToken', res.data.accessToken);

      gameToast.success('Login akun berhasil', {
        onClose: () => navigate('/')
      });

    } catch (err) {
      setLoading(false);

      if (err.response) {
        const { code, message } = err.response.data;

        const validationCodes = ['FIELD_MISSING', 'INVALID_EMAIL', 'INVALID_USERNAME'];

        if (validationCodes.includes(code)) {
          setErrors([message]);
          return;
        }

        if (code === 'INVALID_CREDENTIALS') {
          gameToast.error(message, { toastId: code });
          return;
        }

        if (code === 'SERVER_ERROR') {
          gameToast.error('Server sedang bermasalah, coba lagi nanti', { toastId: code });
          return;
        }
        gameToast.error(message || 'Terjadi kesalahan yang tidak diketahui', { toastId: code });

      } else if (err.request) {
        gameToast.error('Tidak bisa terhubung ke server', { toastId: code });
      } else {
        gameToast.error('Terjadi kesalahan pada client', { toastId: code });
      }
    } 
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <input
        type="email"
        className="form-control mb-3"
        placeholder="Email/username"
        value={identifier}
        onChange={e => setIdentifier(e.target.value)}
        disabled={loading}
      />

      <div className="position-relative mb-3">
        <input
          type={showPassword ? 'text' : 'password'}
          className="form-control"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />

        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          className="btn btn-link btn-sm position-absolute end-0 top-50 translate-middle-y me-2 text-muted"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-3 text-danger">
          {errors.map((err, i) => (
            <p className='mb-0' key={i}>• {err}</p>
          ))}
        </div>
      )}

      <div className="text-end mb-3">
        <Link to="/reset">Lupa password?</Link>
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading}>
        {loading ? 'Memproses...' : 'Masuk'}
      </button>
    </form>
  );
}