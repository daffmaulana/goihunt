// INI ADALAH WRAPPER UNTUK SEMUA HALAMAN (KECUALI AUTH) YANG BERISI TOPBAR, NAVBAR, DAN LOGIC UMUM SEPERTI AMBIL PROFILE, HANDLE XP, DLL

import { Outlet, useNavigate, useLocation } from 'react-router-dom'; // Tambah useLocation
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { gameToast } from '../components/gameToast';
import { PackageSearch, GamepadDirectional } from 'lucide-react';

export default function Wrapper() { // Gunakan Huruf Kapital untuk nama Komponen
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Ambil profile dari backend
  useEffect(() => {
    api.get('/api/profile')
      .then(res => {
        setUser(res.data);
      })
      .catch(() => {
        gameToast.error('Gagal ambil profile');
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Helper untuk mengecek menu aktif
  const isActive = (path) => location.pathname.startsWith(path);

  // 3. Loading guard
  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center">Loading...</div>;
  if (!user) return null;

  const progress = user.progress || 0;

  return (
    <div className="auth-page d-flex flex-column " style={{ paddingBottom: '100px' }}>
      <div id='topbar' className="bg-light rounded-bottom-5 mb-3 shadow-sm">
        <div className="px-4 py-3">
          
          {/* CONTAINER UTAMA: Avatar di Kiri, Konten di Kanan */}
          <div className="d-flex align-items-center gap-4">
            
            {/* 1. AVATAR (KIRI) */}
            <div 
              onClick={() => navigate('/profile')} 
              className="rounded-circle p-1 border border-primary border-2 shadow-sm "
              
            >
              <img 
                width='50' /* Ukuran lebih besar agar mencakup nama & bar */
                height='50'
                className='p-1' 
                src={`/avatars/${user.avatar_key}.png`} 
                alt="avatar" 
                draggable='false'
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>

            {/* 2. KONTEN KANAN (Nama & Progress Bar ditumpuk) */}
            <div className="flex-grow-1 d-flex flex-column gap-2" style={{minWidth: "0"}}>
              
              {/* USERNAME (ATAS) */}
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="btn btn-link text-dark text-decoration-none p-0 border-0"
                style={{ verticalAlign: "baseline" }}
              >
                <h5 className="fw-bold m-0 text-center text-truncate">
                  {user.username}
                </h5>
              </button>
              {/* XP SECTION (BAWAH) */}
              <div className="d-flex align-items-center gap-2">
                <div 
                  className="flex-grow-1" 
                  onClick={() => navigate('/gamifikasi')} 
                >
                  <div className="xp-bar-modern position-relative">
                    <div
                      className="xp-fill-modern"
                      style={{ width: `${progress}%` }}
                    />
                    <div className="xp-content d-flex justify-content-between align-items-center px-2">
                      <span className="level-badge">Lv. {user.level}</span>
                      <span className="xp-text">{user.xp_current}/{user.xp_next} P</span>
                      <span className="level-badge text-end">Lv. {user.level + 1}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      <div id='content' className="px-4">
          <Outlet />
      </div>

      <div id='navbar' className="fixed-bottom d-flex justify-content-center mb-5" >
        <div className="justify-content-center d-flex">
          <div className="bg-white rounded-pill shadow-lg d-flex p-1 shadow" 
              style={{ border: '1px solid #ddd', minWidth: '200px' }}>
            
            {/* Tab Klasifikasi */}
            <button 
              onClick={() => navigate('/klasifikasi')}
              className={`btn rounded-pill px-4 d-flex align-items-center gap-2 ${
                isActive('/klasifikasi') ? 'btn-primary shadow' : 'btn-light border-0 text-muted'
              }`}
            >
              <PackageSearch size={30} fill={isActive('/gamifikasi') ? 'transparent' : 'transparent'} color={isActive('/gamifikasi') ? '#666' : 'white'} />
              {isActive('/klasifikasi') && <span className="fw-bold text-white">Cari</span>}
            </button>

            {/* Tab Gamifikasi */}
            <button 
              onClick={() => navigate('/gamifikasi')}
              className={`btn rounded-pill px-4 d-flex align-items-center gap-2 ${
                isActive('/gamifikasi') ? 'btn-primary shadow' : 'btn-light border-0 text-muted'
              }`}
            >
              <GamepadDirectional size={30} fill={isActive('/gamifikasi') ? 'transparent' : 'transparent'} color={isActive('/gamifikasi') ? 'white' : '#666'} />
              {isActive('/gamifikasi') && <span className="fw-bold text-white">Main</span>}
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}