// /gamifikasi

import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Camera, Medal, Goal, Trophy} from 'lucide-react';
import { UserContext } from '../components/userContext';
import { motion, AnimatePresence } from "framer-motion";

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

export default function Gamifikasi() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('leaderboard/top3'),
      api.get('/achievements'),
      api.get('/mission')
    ])
    .then(([leaderboardRes, achievementsRes, missionRes]) => {
      setLeaders(leaderboardRes.data);
      setAchievements(achievementsRes.data);
      setMission(missionRes.data);
    })
    .catch(err => {
      console.log(err);
    })
    .finally(() => {
      setLoading(false);
    });
  }, []);

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* PAPAN PERINGKAT */}
      <motion.div variants={sectionVariants}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="fw-bold m-0 d-flex align-items-center"><Medal size={20} className="me-2"/>Papan Peringkat</h5>
          <button onClick={() => navigate('/leaderboard')} className="btn btn-sm btn-link text-decoration-none text-muted fw-bold">Lihat Semua</button>
        </div>

        <div className="card border-0 shadow rounded-4 overflow-hidden mb-4" onClick={() => navigate('/leaderboard')}>
          <div className="d-flex w-100">

            {loading
              ? [...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className={`py-3 text-center ${i !== 2 ? 'border-end' : ''}`}
                  style={{flex: '1', minWidth: '0'}}
                >
                  <div className="mb-2 d-flex justify-content-center">
                    <div className="rounded-circle bg-light placeholder-glow" style={{width: 32, height: 32}} />
                  </div>

                  <div className="d-flex justify-content-center mb-2">
                    <div className="rounded-circle bg-light placeholder-glow" style={{width: 60, height: 60}} />
                  </div>

                  <div className="px-3">
                    <p className="placeholder-glow mb-1">
                      <span className="placeholder col-8"></span>
                    </p>

                    <p className="placeholder-glow m-0">
                      <span className="placeholder col-5"></span>
                    </p>
                  </div>
                </div>
              ))

              : leaders.map((user, i) => (
                <div 
                  key={user.id} 
                  className={`py-3 text-center ${i !== 2 ? 'border-end' : ''}`}
                  style={{flex: '1', minWidth: '0'}}
                >
                  <div className="mb-2 d-flex justify-content-center">
                    <div className={`d-inline-flex align-items-center justify-content-center fw-bold text-white shadow-sm circle-badge rounded-circle ${i === 0 ? 'bg-warning' : i === 1 ? 'bg-secondary' : 'bg-danger'}`}>
                      {i + 1}
                    </div>
                  </div>

                  <div className='d-inline-block rounded-circle p-1 border shadow-sm'>
                    <img
                      src={user.avatar_key}
                      width="60" height="60"
                      className="p-1"
                      alt="avatar"
                      onContextMenu={(e) => e.preventDefault()}
                      draggable='false'
                    />
                  </div>

                  <div className="px-3">
                    <p className="fw-bold m-0 text-truncate">
                      {user.username}
                    </p>

                    <p className="text-muted small m-0 text-truncate">
                      {user.xp} P
                    </p>
                  </div>
                </div>
              ))
            }

          </div>
        </div>
      </motion.div>

      {/* MISI */}
      <motion.div variants={sectionVariants}>
        <h5 className="fw-bold mb-2 d-flex align-items-center"><Goal size={20} className="me-2"/>Misi Hari Ini</h5>

        {loading ? (
          <div className="card border-0 shadow rounded-4 p-3 mb-4 d-flex flex-row align-items-center">

            <div
              className="rounded-3 bg-light placeholder-glow me-3"
              style={{width: 54, height: 54}}
            />

            <div className="flex-grow-1">
              <p className="placeholder-glow mb-2">
                <span className="placeholder col-7"></span>
              </p>

              <p className="placeholder-glow m-0">
                <span className="placeholder col-3"></span>
              </p>
            </div>

            <div className="placeholder-glow ms-2">
              <span className="placeholder col-12"></span>
            </div>

          </div>
        ) : (
          <div className="card border-0 shadow rounded-4 p-3 mb-4 d-flex flex-row align-items-center">
            <div 
              className="rounded-3 p-3 me-3 text-white shadow-sm"
              style={{ backgroundColor: "#FCB001"}}
              onClick={() => navigate('/klasifikasi')}
            >
              <Camera size={30} fill='black' color='#FCB001' />
            </div>

            <div className="flex-grow-1">
              <h6 className="fw-bold m-0">
                Cari {mission?.target_item && mission.target_item.charAt(0).toUpperCase() + mission.target_item.slice(1)}
              </h6>

              <p className="text-muted m-0 small">+10 P</p>
            </div>

            <div className="fw-bold small text-muted">
              ({mission?.is_completed ? 1 : 0}/1)
            </div>
          </div>
        )}
      </motion.div>

      {/* ACHIEVEMENT */}
      <motion.div variants={sectionVariants}>
        <h5 className="fw-bold m-0 d-flex align-items-center mb-2">
          <Trophy size={20} className="me-2"/>
          <span>Pencapaian</span>

          {!loading && (
            <span className="text-muted small ms-2">
              ({unlocked}/{total})
            </span>
          )}
        </h5>

        <div className="card border-0 shadow rounded-4 p-3 mb-5">
          <div className="d-flex flex-wrap justify-content-center gap-4">

            {loading
              ? [...Array(4)].map((_, i) => (
                <div key={i} className="text-center" style={{ width: '86px' }}>
                  <div className="d-flex justify-content-center mb-2">
                    <div
                      className="rounded-circle bg-light placeholder-glow"
                      style={{ width: 60, height: 60 }}
                    />
                  </div>

                  <div className="flex-grow-1 d-flex flex-column justify-content-start">
                    <p className="placeholder-glow mb-1">
                      <span className="placeholder col-8"></span>
                    </p>

                    <p className="placeholder-glow mb-0">
                      <span className="placeholder col-12"></span>
                    </p>
                  </div>
                </div>
              ))

              : achievements.map(a => (
                <div key={a.code} className="text-center" style={{ width: '86px' }}>
                  <div className="position-relative">
                    <img
                      src={a.icon}
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
              ))
            }

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}