// /gamifikasi

import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Camera, Medal, Goal, Trophy} from 'lucide-react';

export default function Gamifikasi() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [mission, setMission] = useState(null);

  useEffect(() => {
    api.get('/api/leaderboard')
      .then(res => setLeaders(res.data.slice(0, 3)))
      .catch(() => console.log('error leaderboard'));
  }, []);

  useEffect(() => {
    api.get('/api/achievements')
      .then(res => setAchievements(res.data))
      .catch(() => console.log('error achievements'));
  }, []);

  useEffect(() => {
    api.get('/api/mission')
      .then(res => setMission(res.data))
      .catch(() => console.log('error mission'));
  }, []);



  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;



  return (
    <div className="">
      
      {/* 🏆 PAPAN PERINGKAT SECTION */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="fw-bold m-0 d-flex align-items-center"><Medal size={20} className="me-2"/>Papan Peringkat</h5>
        <button onClick={() => navigate('/leaderboard')} className="btn btn-sm btn-link text-decoration-none text-muted fw-bold">Lihat Semua</button>
      </div>
      
      <div className="card border-0 shadow rounded-4 overflow-hidden mb-4" onClick={() => navigate('/leaderboard')}>
        <div className="d-flex w-100">
          {leaders.slice(0, 3).map((user, i) => (
            <div 
              key={user.id} 
              className={`py-3 text-center ${i !== 2 ? 'border-end' : ''}`}
              style={{ 
                flex: '1',      // Membagi 3 bagian sama besar (33.3%)
                minWidth: '0'   // WAJIB: Agar teks panjang bisa terpotong (truncate)
              }}
            >
              {/* Badge Angka */}
              <div className="mb-2 d-flex justify-content-center">
                <div className={`d-inline-flex align-items-center justify-content-center fw-bold text-white shadow-sm circle-badge rounded-circle ${i === 0 ? 'bg-warning' : i === 1 ? 'bg-secondary' : 'bg-danger'}`}>
                  {i + 1}
                </div>
              </div>

              {/* Foto Profil */}
              <div className='d-inline-block rounded-circle p-1 border shadow-sm '>
              <img
                src={`/avatars/${user.avatar_key}.png`}
                width="60" height="60"
                className="p-1"
                alt="avatar"
                onContextMenu={(e) => e.preventDefault()}
                draggable='false'
              />
              </div>

              {/* Username & XP */}
              <div className="px-3">
                <p className="fw-bold m-0 text-truncate">
                  {user.username}
                </p>
                <p className="text-muted small m-0 text-truncate">
                  {user.xp} P
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>















      {/* 🎯 MISI SECTION */}
      <h5 className="fw-bold mb-2 d-flex align-items-center"><Goal size={20} className="me-2"/>Misi Hari Ini</h5>

      <div className="card border-0 shadow rounded-4 p-3 mb-4 d-flex flex-row align-items-center">
        <div 
          className="rounded-3 p-3 me-3 text-white shadow-sm"
          style={{ backgroundColor: "#FCB001"}} // Perbaikan di sini
          onClick={() => navigate('/klasifikasi')}
        >
          <Camera size={30} fill='black' color='#FCB001' />
        </div>

        <div className="flex-grow-1">
          <h6 className="fw-bold m-0">Cari {mission?.target_item && mission.target_item.charAt(0).toUpperCase() + mission.target_item.slice(1)}</h6>
          <p className="text-muted m-0 small">+20 XP</p>
        </div>
        <div className="fw-bold small text-muted">
          ({mission?.is_completed ? 1 : 0}/1)
        </div>
      </div>













      {/* 🎖️ PENCAPAIAN SECTION */}
      <h5 className="fw-bold m-0 d-flex align-items-center mb-2">
        <Trophy size={20} className="me-2"/>
        <span>Pencapaian</span>
        <span className="text-muted small ms-2">
          ({unlocked}/{total})
        </span>
      </h5>
      
      <div className="card border-0 shadow rounded-4 p-3 mb-5">
        <div className="d-flex flex-wrap justify-content-center gap-4">
          {achievements.map(a => (
            <div key={a.code} className="text-center" style={{ width: '86px' }}>
              <div className="position-relative">
                <img
                  src={`/badges/${a.icon}.png`}
                  width="60"
                  height="60"
                  className="mb-1"
                  alt={a.name}
                  style={{
                    filter: a.unlocked ? 'none' : 'grayscale(100%)',
                    opacity: a.unlocked ? 1 : 0.3
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  draggable='false'
                />
              </div>
              <div className="flex-grow-1 d-flex flex-column justify-content-start">
                <p className="fw-bold small mb-1">
                  {a.name}
                </p>
                <p className="text-muted small mb-0">
                  {a.deskripsi}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}