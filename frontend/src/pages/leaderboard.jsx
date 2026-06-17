import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Medal, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

const containerStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 26 } 
  }
};

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [me, setMe] = useState(null);

  useEffect(() => {
    api.get('/leaderboard')
      .then(res => setUsers(res.data))
      .catch(() => console.log('error leaderboard'));
  }, []);

  useEffect(() => {
  api.get('/profile')
    .then(res => setMe(res.data))
}, []);

  return (
    <div className="auth-page d-flex flex-column px-4 py-5 ">
      <div className="mb-4">
        <button
          type="button"
          className="btn p-0 btn-link text-decoration-none text-muted d-flex align-items-center"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} className="me-2" />
          <span className="fw-bold">Kembali</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="card border-0 shadow rounded-4 overflow-hidden mb-4">
          
          <div className="bg-white p-3 border-bottom text-center">
            <Medal className="text-warning mb-2" size={32} />
            <h5 className="fw-bold m-0">Papan Peringkat</h5>
          </div>

          <motion.div 
            key={users.length}
            variants={containerStagger}
            initial="hidden"
            animate="visible"
            className="list-group list-group-flush"
          >
            {users.map((user, i) => {
              const isMe = user.id === me?.id;
              const rank = i + 1;

              return (
                <motion.div 
                  key={user.id}
                  variants={listItemVariants}
                  className={`list-group-item border-0 d-flex align-items-center py-3 px-3  ${
                    isMe ? 'bg-primary bg-opacity-10' : ''
                  }`}
                >
                  {/* PERINGKAT */}
                  <div className="flex-shrink-0 d-flex justify-content-center me-2 " style={{ width: '35px' }}>
                    {rank === 1 ? (
                      <div className="circle-badge rounded-circle bg-warning fw-bold text-white shadow-sm">1</div>
                    ) : rank === 2 ? (
                      <div className="circle-badge rounded-circle bg-secondary fw-bold text-white shadow-sm">2</div>
                    ) : rank === 3 ? (
                      <div className="circle-badge rounded-circle bg-danger fw-bold text-white shadow-sm">3</div>
                    ) : (
                      <div className="circle-badge fw-bold text-muted small">{rank}</div>
                    )}
                  </div>

                  <div className={`flex-shrink-0 rounded-circle p-1 border shadow-sm me-2 ${isMe ? 'border-primary' : 'bg-light'}`}>
                    <img
                      src={user.avatar_key}
                      width="40"
                      height="40"
                      className="p-1 img-fluid"
                      draggable="false"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>

                  <div className="flex-grow-1" style={{ minWidth: 0 }}> 
                    <p className="m-0 fw-bold text-truncate">
                      {isMe ? `${user.username} (Aku)` : user.username}
                    </p>
                    <p className="text-muted small m-0">Lv. {user.level}</p>
                  </div>

                  <div className="flex-shrink-0 ms-2 text-end">
                    <span className="badge rounded-pill bg-light text-dark border px-2 py-2 shadow-sm">
                      <span className="fw-bold">{user.xp}</span>
                      <span className="small text-muted ms-1">P</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}