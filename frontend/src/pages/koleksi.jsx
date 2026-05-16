// /koleksi

import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PackageX,
  X
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function Koleksi() {
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
  try {
    const res = await api.get('/api/collection');

    // semua data dari endpoint collection
    // dianggap SUDAH terkoleksi
    const mapped = res.data.map((item) => ({
      ...item
    }));

    setCollections(mapped);
  } catch (err) {
    console.log('error collection');
  }
};

  // =========================
  // OPEN NEXT CARD
  // =========================
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

  // =========================
  // OPEN PREVIOUS CARD
  // =========================
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

  // =========================
  // TOGGLE COLLECTION
  // =========================
  const deleteCollection = async () => {
  if (!selected) return;

  try {
    await api.delete(`/api/collection/${selected.id}`);

    // hapus dari grid
    setCollections((prev) =>
      prev.filter((item) => item.id !== selected.id)
    );

    // tutup modal
    setSelected(null);

  } catch (err) {
    console.log('delete collection error');
  }
};

 return (
  <div className="auth-page d-flex flex-column px-4 py-5">
    {/* Header Back Button */}
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

    <h3 className="fw-bold mb-4">Koleksi</h3>

    {/* GRID KOLEKSI */}
    <div className="glass-container rounded-4 p-3 mb-5">
      <div className={`d-flex flex-wrap justify-content-center gap-2 ${collections.length === 0 ? 'py-4' : ''}`}>
        {collections.length > 0 ? (
          collections.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className="glass-card-item text-center rounded-4 p-2"
              style={{ width: '110px', cursor: 'pointer' }}
            >
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
            </div>
          ))
        ) : (
          <div className="text-center py-3 text-muted fw-bold">
            Kamu belum ada koleksi, ayo cari objek!
          </div>
        )}
      </div>
    </div>

    {/* MODAL / POPUP */}
    {selected && (
  <div
    className="glass-overlay position-fixed top-0 start-0 w-100 h-100"
    style={{
      zIndex: 1000,
      overflowY: 'auto',
      padding: '24px 0',
    }}
    onClick={() => setSelected(null)}
  >
    {/* WRAPPER */}
    <div className="d-flex justify-content-center px-3 align-items-center"
    style={{
          minHeight: '85vh',
        }}>

      {/* POPUP */}
      <div
        className="glass-popup rounded-5 shadow-lg w-100 position-relative d-flex flex-column"
        style={{
          maxWidth: '300px',
          maxHeight: '85vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
<div className='justify-content-between align-items-center p-4'>
        <div className="bg-white rounded-4 d-flex align-items-center justify-content-between p-3 text-center">
            <div style={{ width: '32px' }}></div>

            <div>
              <small className="text-muted">{selected.furigana}</small>
              <h2 className="fw-bold m-0">{selected.kanji}</h2>
              <small className="text-muted">{selected.romaji}</small>
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

        
        {/* CONTENT SCROLLABLE */}
        <div
          className="px-4"
          style={{
            overflowY: 'auto',
          }}
        >

          {/* Header Info */}
          

          {/* Image */}
          <div className="mb-3">
            <img
              src={selected.image_url}
              className="w-100 rounded-4 border border-white border-4 shadow-sm bg-white"
              alt="vocabulary"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>

          {/* Content */}
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

        {/* FOOTER */}
        <div className="d-flex justify-content-between align-items-center p-3">
          <button onClick={prevCard} className="bg-white btn glass-nav-btn rounded-circle shadow-sm">
            <ChevronLeft size={20} />
          </button>

          <button onClick={() => setSelected(null)} className="bg-white btn glass-nav-btn rounded-circle shadow-sm" >
            <X size={20} />
          </button>
          

          <button onClick={nextCard}  className="bg-white btn glass-nav-btn rounded-circle shadow-sm">
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </div>
  </div>
)}
  </div>
);
}