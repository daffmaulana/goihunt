// INI ADALAH WRAPPER UNTUK SEMUA HALAMAN (KECUALI AUTH) YANG BERISI TOPBAR, NAVBAR, DAN LOGIC UMUM SEPERTI AMBIL PROFILE, HANDLE XP, DLL

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import { api } from '../api/axios';
import { gameToast } from '../components/gameToast';
import { PackageSearch, GamepadDirectional, BookCheck } from 'lucide-react';
import { UserContext } from '../components/userContext';

export default function Wrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, refreshUser } = useContext(UserContext);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
      refreshUser();
    }, [refreshUser]);

  // Ambil jumlah vocab yang perlu direview hari ini
  useEffect(() => {
    api.get('/review/count')
      .then((res) => setReviewCount(res.data.count))
      .catch(() => {});
  }, [location.pathname]);

  const isActive = (path) => location.pathname.startsWith(path);
  
  if (!user) return null;

  const progress = user.progress || 0;

  return (
    <div className="auth-page d-flex flex-column " style={{ paddingBottom: '100px' }}>
      
      {/* TOPBAR */}
      <div id='topbar' className="bg-light rounded-bottom-5 mb-3 shadow-sm">
        <div className="px-4 py-3">
          <div className="d-flex align-items-center gap-4">
            <div 
              onClick={() => navigate('/profile')} 
              className="rounded-circle p-1 border border-primary border-2 shadow-sm "
            >
              <img 
                width='50'
                height='50'
                className='p-1' 
                src={user.avatar_key} 
                alt="avatar" 
                draggable='false'
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <div className="flex-grow-1 d-flex flex-column gap-2" style={{minWidth: "0"}}>
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
              <div className="d-flex align-items-center gap-2">
                <div className="flex-grow-1" onClick={() => navigate('/gamifikasi')}>
                  <div className="xp-bar-modern position-relative">
                    <div className="xp-fill-modern" style={{ width: `${progress}%` }}
                    />
                    <div className="xp-content d-flex justify-content-between align-items-center px-2">
                      <span className="level-badge">Tk. {user.level}</span>
                      <span className="xp-text">{user.xp_current}/{user.xp_next} P</span>
                      <span className="level-badge text-end">Tk. {user.level + 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KLASIFIKASI.JSX ATAU GAMIFIKASI.JSX */}
      <div id='content' className="px-4">
          <Outlet />
      </div>

      {/* NAVBAR */}
      <div id='navbar' className="fixed-bottom d-flex justify-content-center mb-5" >
        <div className="justify-content-center d-flex">
          <div className="bg-white rounded-pill shadow-lg d-flex p-1 shadow" style={{ border: '1px solid #ddd', minWidth: '200px' }}>
            {/* Tab Klasifikasi */}
            <button 
              onClick={() => navigate('/klasifikasi')}
              className={`btn rounded-pill px-4 d-flex align-items-center gap-2 ${
                isActive('/klasifikasi') ? 'btn-primary shadow' : 'btn-light border-0 text-muted'
              }`}
            >
              <PackageSearch size={30} color={isActive('/klasifikasi') ? 'white' : '#666'} />
              {isActive('/klasifikasi') && <span className="fw-bold text-white">Cari</span>}
            </button>

            {/* Tab Review */}
            <button
              onClick={() => navigate('/review')}
              className={`btn rounded-pill px-4 d-flex align-items-center gap-2 position-relative ${
                isActive('/review') ? 'btn-primary shadow' : 'btn-light border-0 text-muted'
              }`}
            >
              <BookCheck size={30} color={isActive('/review') ? 'white' : '#666'} />
              {isActive('/review') && <span className="fw-bold text-white">Review</span>}
              {/* Badge jumlah vocab yang perlu direview */}
              {!isActive('/review') && reviewCount > 0 && (
                <span
                  className="position-absolute badge rounded-pill bg-danger"
                  style={{ top: '4px', right: '4px', fontSize: '10px', minWidth: '18px', padding: '2px 5px' }}
                >
                  {reviewCount > 99 ? '99+' : reviewCount}
                </span>
              )}
            </button>

            {/* Tab Gamifikasi */}
            <button 
              onClick={() => navigate('/gamifikasi')}
              className={`btn rounded-pill px-4 d-flex align-items-center gap-2 ${
                isActive('/gamifikasi') ? 'btn-primary shadow' : 'btn-light border-0 text-muted'
              }`}
            >
              <GamepadDirectional size={30} color={isActive('/gamifikasi') ? 'white' : '#666'} />
              {isActive('/gamifikasi') && <span className="fw-bold text-white">Main</span>}
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}
