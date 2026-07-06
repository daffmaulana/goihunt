// Form registrasi di halaman auth

import { useState } from 'react';
import { api } from '../api/axios';
import { gameToast } from "../components/gameToast";
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors([]);

    if (loading) return;

    const newErrors = [];

    if (!username) newErrors.push('Username wajib diisi');
    if (!email) newErrors.push('Email wajib diisi');
    if (!password) newErrors.push('Password wajib diisi');
    if (!confirmPassword) newErrors.push('Konfirmasi password wajib diisi');

    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      newErrors.push('Username 3-20 karakter, hanya huruf kecil, angka, dan underscore');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.push('Format email tidak valid');
    }

    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.push('Konfirmasi password tidak cocok');
    }

    if (password && password.length < 8) {
      newErrors.push('Password minimal 8 karakter');
    }

    if (password && !/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
      newErrors.push('Password harus mengandung huruf dan angka');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        username,
        email,
        password,
        confirmPassword
      });

      localStorage.setItem('accessToken', res.data.accessToken);

      gameToast.success('Akun berhasil dibuat', {
        onClose: () => navigate('/')
      });

    } catch (err) {
      setLoading(false);

      if (err.response) {
        const { code, message } = err.response.data;

        const validationCodes = [
          'FIELD_MISSING',
          'INVALID_USERNAME',
          'INVALID_EMAIL',
          'PASSWORD_MISMATCH',
          'WEAK_PASSWORD'
        ];

        if (validationCodes.includes(code)) {
          setErrors([message]);
          return;
        }

        if (code === 'USER_EXISTS') {
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
        className="form-control mb-3"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        disabled={loading}
      />

      <input
        type="email"
        className="form-control mb-3"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
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

      <input
        type="password"
        className="form-control mb-3"
        placeholder="Konfirmasi Password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        disabled={loading}
      />

      {errors.length > 0 && (
        <div className="mb-3 text-danger">
          {errors.map((err, i) => (
            <p className='mb-0' key={i}>• {err}</p>
          ))}
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading}>
        {loading ? 'Memproses...' : 'Daftar'}
      </button>
    </form>
  );
}