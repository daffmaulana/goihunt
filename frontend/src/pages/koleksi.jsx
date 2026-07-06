import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { ArrowLeft, ChevronLeft, ChevronRight, PackageX, Star, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { gameToast } from '../components/gameToast';

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
  };

  const overlayFade = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const containerStagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

export default function Koleksi() {
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'mastered' | 'unmastered'

  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await api.get('/collection');
      setCollections(res.data);
    } catch (err) {
      console.log('error collection');
    }
  };

  const nextCard = () => {
    if (!selected) return;

    const currentIndex = collections.findIndex(
      (item) => item.id === selected.id
    );

    const nextIndex =
      currentIndex === collections.length - 1
        ? 0
        : currentIndex + 1;

    setSelected(collections[nextIndex]);
  };

  const prevCard = () => {
    if (!selected) return;

    const currentIndex = collections.findIndex(
      (item) => item.id === selected.id
    );

    const prevIndex =
      currentIndex === 0
        ? collections.length - 1
        : currentIndex - 1;

    setSelected(collections[prevIndex]);
  };

  const deleteCollection = async () => {
    if (!selected) return;

    try {
      await api.delete(`/collection/${selected.id}`);

      setCollections((prev) =>
        prev.filter((item) => item.id !== selected.id)
      );

      setSelected(null);

      gameToast.success("Berhasil menghapus koleksi")

    } catch (err) {
      console.log('delete collection error');
    }
  };

  const masteredCount = collections.filter(c => c.mastered_at).length;
  const filteredCollections = collections.filter(c => {
    if (filter === 'mastered') return !!c.mastered_at;
    if (filter === 'unmastered') return !c.mastered_at;
    return true;
  });

 return (
  <div className="auth-page d-flex flex-column px-4 py-5">
  
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

    {/* KOLEKSI */}
    <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    >
    
      <h3 className="fw-bold mb-3">Koleksi</h3>

      {/* STAT DIKUASAI */}
      {collections.length > 0 && (
        <div className="d-flex align-items-center gap-2 mb-3">
          <Star size={16} className="text-warning" fill="currentColor" />
          <small className="fw-semibold text-muted">
            Dikuasai: <span className="text-dark">{masteredCount}</span> / {collections.length} vocab
          </small>
        </div>
      )}

      {/* FILTER */}
      {collections.length > 0 && (
        <div className="d-flex gap-2 mb-3">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'mastered', label: '⭐ Dikuasai' },
            { key: 'unmastered', label: 'Belum Dikuasai' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`btn btn-sm rounded-pill px-3 ${filter === f.key ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="glass-container rounded-4 p-3 mb-5">
        <motion.div 
          key={`${collections.length}-${filter}`}
          variants={containerStagger}
          initial="hidden"
          animate="visible"
          className={`d-flex flex-wrap justify-content-center gap-2 ${filteredCollections.length === 0 ? 'py-4' : ''}`}
        >
          {collections.length === 0 ? (
            <div className="text-center py-3 text-muted fw-bold">
              Kamu belum ada koleksi, ayo cari objek!
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="text-center py-3 text-muted fw-bold">
              Tidak ada vocab di kategori ini.
            </div>
          ) : (
            filteredCollections.map((item) => (
              <motion.div
                key={item.id}
                variants={cardItemVariants}
                onClick={() => setSelected(item)}
                className="glass-card-item text-center rounded-4 p-2 position-relative"
                style={{ width: '110px', cursor: 'pointer', opacity: item.mastered_at ? 1 : 0.65 }}
              >
                {item.mastered_at && (
                  <div
                    className="position-absolute top-0 end-0 m-1"
                    style={{ lineHeight: 1 }}
                    title="Dikuasai"
                  >
                    <Star size={16} className="text-warning" fill="currentColor" />
                  </div>
                )}
                <div className="mb-2">
                  <img
                    src={item.image_url}
                    width="85"
                    height="85"
                    className="rounded-3 object-fit-cover shadow-sm bg-white"
                    alt={item.label}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
                <p className="fw-bold m-0 small text-truncate">
                  {item.label}
                </p>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </motion.div>

    {/* MODAL */}
    <AnimatePresence>
      {selected && (
        <motion.div
          variants={overlayFade}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="glass-overlay position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1000, overflowY: 'auto', padding: '24px 0'}}
          onClick={() => setSelected(null)}
        >
          <div
            className="d-flex justify-content-center px-3 align-items-center"
            style={{minHeight: '85vh'}}
          >
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-popup rounded-5 shadow-lg w-100 position-relative d-flex flex-column"
              style={{maxWidth: '300px', maxHeight: '85vh'}}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="justify-content-between align-items-center p-4">
                <div className="bg-white rounded-4 d-flex align-items-center justify-content-between p-3 text-center">
                  <div style={{ width: '32px' }}></div>

                  <div>
                    <small className="text-muted">{selected.furigana}</small>
                    <h2 className="fw-bold m-0">{selected.kanji}</h2>
                    <small className="text-muted">{selected.romaji}</small>
                    {selected.mastered_at ? (
                      <div className="mt-1">
                        <span className="badge rounded-pill text-bg-warning d-inline-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                          <Star size={11} fill="currentColor" /> Dikuasai
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className="badge rounded-pill text-bg-secondary d-inline-flex align-items-center gap-1" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                          Belum dikuasai
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={deleteCollection}
                    className="btn p-0 border-0 text-danger"
                    style={{ width: '32px' }}
                  >
                    <PackageX size={28} />
                  </button>
                </div>
              </div>

              <div className="px-4" style={{overflowY: 'auto'}}>
                <div className="mb-3">
                  <img
                    src={selected.image_url}
                    className="w-100 rounded-4 border border-white border-4 shadow-sm bg-white"
                    alt="vocabulary"
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>

                <div className="bg-white rounded-4 p-3 text-start shadow-sm">
                  <div className="mb-3">
                    <h6 className="fw-bold mb-1 small">Definisi:</h6>
                    <small className="small m-0 text-dark">
                      {selected.definition}
                    </small>
                  </div>

                  <div>
                    <h6 className="fw-bold mb-1 small">Contoh Kalimat:</h6>

                    <div className="d-flex flex-column gap-1">
                      <small>{selected.example_furigana}</small>
                      <small className="fst-italic">
                        {selected.example_romaji}
                      </small>
                      <small>{selected.example_id}</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center p-3">
                <button
                  onClick={prevCard}
                  className="bg-white btn glass-nav-btn rounded-circle shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={() => setSelected(null)}
                  className="bg-white btn glass-nav-btn rounded-circle shadow-sm"
                >
                  <X size={20} />
                </button>

                <button
                  onClick={nextCard}
                  className="bg-white btn glass-nav-btn rounded-circle shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
 );
}