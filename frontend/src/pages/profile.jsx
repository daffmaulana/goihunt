import { useEffect, useState } from 'react';
import api from '../api/axios';
import { gameToast } from '../components/gameToast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, KeyRound, LogOut, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

const AVATARS = ['bear', 'cat', 'cow', 'dog', 'panda', 'rabbit', 'tiger', 'whale','worm','penguin'];

const containerVariants = {
  initial: { opacity: 1 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const sectionVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export default function profile() {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [avatarKey, setAvatarKey] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState([]);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/profile')
      .then(res => {
        setProfile(res.data);
        setUsername(res.data.username);
        setAvatarKey(res.data.avatar_key);
      })
      .catch(() => alert('Unauthorized'));
  }, []);

  const handleUpdateProfile = async () => {
    setProfileErrors([]);
    const newErrors = [];

    const payload = {};

    if (!username) newErrors.push('Username wajib diisi');

    if (username !== profile.username) {
      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        newErrors.push('Username 3-20 karakter, hanya huruf kecil, angka, atau underscore');
      }
      payload.username = username
    }

    if (avatarKey !== profile.avatar_key) {
      payload.profileImage = avatarKey;
    }

    if (Object.keys(payload).length === 0) {
      newErrors.push('Tidak ada perubahan yang dilakukan');
    }

    if (newErrors.length > 0) {
      setProfileErrors(newErrors);
      return;
    }

    setProfileLoading(true);

    try {
      const res = await api.put('/profile', payload);

      gameToast.success(res.data.message, {
        onClose: () => setProfileLoading(false)
      });

      setProfile({ ...profile, ...payload, avatar_key: avatarKey });

    } catch (err) {
      if (err.response) {
        const { code, message } = err.response.data;

        const validationCodes = ['FIELD_MISSING', 'INVALID_USERNAME'];

        if (validationCodes.includes(code)) {
          setProfileErrors([message]);
          return;
        }

        if (code === 'USERNAME_EXISTS') {
          gameToast.error(message);
          return;
        }

        if (code === 'SERVER_ERROR') {
          gameToast.error('Server bermasalah, coba lagi nanti');
          return;
        }

        gameToast.error(message || 'Terjadi kesalahan');

      } else if (err.request) {
        gameToast.error('Tidak bisa terhubung ke server');
      } else {
        gameToast.error('Terjadi kesalahan pada client');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async () => {

  setPasswordErrors([]);
  const newErrors = [];

  if (!currentPassword) (newErrors.push('Password lama wajib diisi'));
  if (!newPassword) (newErrors.push('Password baru wajib diisi'));
  if (!confirmPassword) (newErrors.push('Konfirmasi password baru wajib diisi'));

  if (newPassword !== confirmPassword) {
    newErrors.push('Konfirmasi password baru tidak cocok');
  }

  if (newPassword && newPassword.length < 8) {
    newErrors.push('Password minimal 8 karakter');
  }

  if (newPassword && !/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword)) {
    newErrors.push('Password harus mengandung huruf dan angka');
  }

  if (newErrors.length > 0) {
    setPasswordErrors(newErrors);
    return;
  }

  setPasswordLoading(true);

  try {
    const res = await api.put('/profile/password', {
      currentPassword,
      newPassword,
      confirmPassword
    });

    localStorage.removeItem('accessToken');

    gameToast.success(res.data.message, {
      onClose: () => navigate('/')
    });

  } catch (err) {
    if (err.response) {
      const { code, message } = err.response.data;

      const validationCodes = [
        'FIELD_MISSING',
        'PASSWORD_MISMATCH',
        'WEAK_PASSWORD'
      ];

    if (validationCodes.includes(code)) {
      setPasswordErrors([message]);
      return;
    }

    if (code === 'INVALID_OLD_PASSWORD') {
      gameToast.error(message, { toastId: code });
      return;
    }

    if (code === 'SAME_PASSWORD') {
      gameToast.error(message, { toastId: code });
      return;
    }

    if (code === 'SERVER_ERROR') {
      gameToast.error('Server bermasalah, coba lagi nanti', { toastId: code });
      return;
    }

    gameToast.error(message || 'Terjadi kesalahan', { toastId: code });

    } else if (err.request) {
      gameToast.error('Tidak bisa terhubung ke server', { toastId: code });
    } else {
      gameToast.error('Terjadi kesalahan pada client', { toastId: code });
    }
    } finally {
    setPasswordLoading(false);
}
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}

    localStorage.removeItem('accessToken');
    window.location.href = '/';
  };

  return (
    <div className="auth-page d-flex flex-column justify-content-center px-4 py-5">
      <div className=""> 
        
        <div className="mb-4">
          <button type="button" className="btn p-0 btn-link text-decoration-none text-muted d-flex align-items-center" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="me-2" />
            <span className='fw-bold'>Kembali</span>
          </button>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={sectionVariants}>

          <h3 className="fw-bold mb-4">Pengaturan</h3>

          {/* UBAH PROFIL */}
          <div className="card rounded-4 shadow p-4 mb-4 border-0">
            <div className="d-flex align-items-center mb-3 ">
              <User size={20} className="me-2" />
              <h5 className="fw-bold mb-0">Profil Saya</h5>
            </div>

            <div className="text-center mb-4">
              <div className="position-relative d-inline-block rounded-circle shadow-sm border p-1">
                <img
                  src={`/avatars/${avatarKey || 'bear'}.svg`}
                  alt="Avatar"
                  width={100}
                  height={100}
                  draggable="false"
                  className="p-2"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </div>

            <p className="small mb-2 text-center">Pilih Avatar:</p>
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
              {AVATARS.map(a => (
                <button
                  key={a}
                  onClick={() => setAvatarKey(a)}
                  className={`btn btn-link rounded-circle shadow-sm border p-1 border-2 ${avatarKey === a ? 'border-primary' : 'border-transparent'}`}
                  disabled={profileLoading}
                >
                  <img draggable="false" src={`/avatars/${a}.svg`} width={45} height={45} className="p-1" onContextMenu={(e) => e.preventDefault()}/>
                </button>
              ))}
            </div>


            <label className="small mb-1 d-flex align-items-center gap-1 line-height-0">Email <Lock size={15} /></label>
            <input
              type='email'
              className="form-control mb-3"
              value={profile?.email}
              disabled
            />

            <label className="small mb-1">Username</label>
            <input
              className="form-control mb-3"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              disabled={profileLoading}
            />

            {profileErrors.length > 0 && (
              <div className="mb-3 text-danger small">
                {profileErrors.map((err, i) => (
                  <p className="mb-0" key={i}>• {err}</p>
                ))}
              </div>
            )}

            <button
              className="btn btn-primary w-100 btn-lg"
              onClick={handleUpdateProfile}
              disabled={profileLoading}
            >
              {profileLoading ? 'Menyimpan...' : 'Perbarui Profil'}
            </button>
          </div>
          </motion.div>

          {/* UBAH PASSWORD */}
          <motion.div variants={sectionVariants}>
          <div className="card rounded-4 shadow p-4 mb-4 border-0">
            <div className="d-flex align-items-center mb-3">
              <KeyRound size={20} className="me-2" />
              <h5 className="fw-bold mb-0">Ubah Password</h5>
            </div>

            <div className="position-relative mb-3">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Password Lama"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                disabled={passwordLoading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="btn btn-link btn-sm position-absolute end-0 top-50 translate-middle-y me-2 text-muted"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="position-relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Password Baru"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={passwordLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn btn-link btn-sm position-absolute end-0 top-50 translate-middle-y me-2 text-muted"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <input
              type="password"
              className="form-control mb-3"
              placeholder="Konfirmasi Password Baru"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={passwordLoading}
            />
            {passwordErrors.length > 0 && (
              <div className="mb-3 text-danger small">
                {passwordErrors.map((err, i) => (
                  <p className="mb-0" key={i}>• {err}</p>
                ))}
              </div>
            )}

            <button className="btn btn-primary w-100 btn-lg" onClick={handleUpdatePassword} disabled={passwordLoading}>
              {passwordLoading ? 'Menyimpan...' : 'Perbarui Password'}
            </button>
          </div>
          </motion.div>

          <motion.div variants={sectionVariants}>
          <div className="text-center mt-5">
            <button 
              className="btn btn-link text-danger text-decoration-none d-inline-flex align-items-center" 
              onClick={handleLogout}
            >
              <LogOut size={18} className="me-2" />
              <strong>Keluar dari Akun</strong>
            </button>
          </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

