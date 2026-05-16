import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { gameToast } from "../components/gameToast";
import { FolderOpen, Camera, X, Star, StarOff, ArrowLeft, Library, ImageIcon } from "lucide-react";
import api from "../api/axios";

// ─── Pure helpers ────────────────────────────────────────────────────────────

const preprocessImage = (img) =>
  tf.browser
    .fromPixels(img)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .div(127.5)
    .sub(1)
    .expandDims();

const cropImageToSquare = (imageSrc) =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
  });

// ─── Component ───────────────────────────────────────────────────────────────

export default function Klasifikasi() {
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [model, setModel] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [labels, setLabels] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [currentVocab, setCurrentVocab] = useState(null);
  const [vocabDetail, setVocabDetail] = useState(null);
  const [isCollected, setIsCollected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);

  // ─── Load model + labels (paralel) ───────────────────────────────────────

  useEffect(() => {
    const loadResources = async () => {
      try {
        const [loadedModel, labelText] = await Promise.all([
          tf.loadGraphModel("/model/model.json"),
          fetch("/model/labels.txt").then((r) => r.text()),
        ]);
        modelRef.current = loadedModel;
        setModel(loadedModel);
        const cleanLabels = labelText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        setLabels(cleanLabels);
      } catch (err) {
        console.error("Failed to load resources:", err);
      }
    };
    loadResources();
    return () => {
      modelRef.current?.dispose();
      modelRef.current = null;
    };
  }, []);

  // ─── Camera: start/stop stream ───────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    let localStream = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream = stream;
        streamRef.current = stream;
        setCameraOn(true);
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    if (!previewMode) startCamera();

    return () => {
      mounted = false;
      localStream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
    };
  }, [previewMode]);

  // ─── Camera: attach stream ke video setelah DOM siap ─────────────────────

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => videoRef.current?.play();
    }
  }, [cameraOn]);

  // ─── Quiz ─────────────────────────────────────────────────────────────────

  const loadQuiz = async (vocabId) => {
    try {
      const res = await api.get(`/api/quiz/${vocabId}`);
      setQuiz(res.data);
      setShowQuiz(true);
    } catch (err) {
      console.error("Error load quiz:", err);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      const res = await api.post("/api/quiz/submit", {
        quizId: quiz.id,
        answer,
        vocabId: quiz.vocab_id,
      });
      const { correct, xpChange, alreadyMastered } = res.data;
      if (correct && xpChange > 0) gameToast.success(`Benar! +${xpChange} XP`);
      else if (!correct && xpChange < 0) gameToast.error(`Salah! ${xpChange} XP`);
      else if (alreadyMastered) gameToast.info("Sudah pernah benar sebelumnya");

      setVocabDetail({ ...currentVocab, capturedImage });
      setShowVocab(true);
      setShowQuiz(false);
      setQuiz(null);
    } catch {
      gameToast.error("Error submit quiz");
    }
  };

  // ─── Capture ──────────────────────────────────────────────────────────────

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = video.getBoundingClientRect();
    const scaleX = video.videoWidth / rect.width;
    const overlaySize = rect.width * 0.6;
    const size = overlaySize * scaleX;
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
    setCapturedImage(canvas.toDataURL("image/png"));
    setPreviewMode(true);
  };

  // ─── Predict ──────────────────────────────────────────────────────────────

  const getTopPrediction = useCallback(
    (data) => {
      let maxIndex = 0;
      for (let i = 1; i < data.length; i++) {
        if (data[i] > data[maxIndex]) maxIndex = i;
      }
      const cleanLabel = labels[maxIndex]
        ?.split(",")[0]
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      return { label: cleanLabel, confidence: data[maxIndex] };
    },
    [labels]
  );

  const predictImage = useCallback(
    (imageSrc) =>
      new Promise((resolve) => {
        if (!modelRef.current) return resolve(null);
        const img = new Image();
        img.src = imageSrc;
        img.onload = async () => {
          const tensor = preprocessImage(img);
          const prediction = modelRef.current.execute(tensor);
          const data = await prediction.data();
          const result = getTopPrediction(data);
          tf.dispose([tensor, prediction]);
          resolve(result);
        };
      }),
    [getTopPrediction]
  );

  const handleUsePhoto = async () => {
    setPreviewMode(false);
    setIsLoading(true);
    try {
      const result = await predictImage(capturedImage);
      if (!result) {
        gameToast.error("Model belum siap");
        return;
      }
      const { label, confidence } = result;
      if (confidence < 0.5) {
        gameToast.error("Objek kurang jelas, coba lagi");
        return;
      }
      const res = await api.get(`/api/classify/${label}?classify=true`);
      const vocab = res.data;
      setCurrentVocab(vocab);
      setIsCollected(vocab.collected);
      loadQuiz(vocab.id);
    } catch (err) {
      if (err.response?.status === 404) gameToast.error("Objek belum tersedia di sistem");
      else gameToast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Gallery ──────────────────────────────────────────────────────────────

  const handleGalleryChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const croppedImage = await cropImageToSquare(url);
    URL.revokeObjectURL(url);
    setCapturedImage(croppedImage);
    setPreviewMode(true);
    e.target.value = "";
  };

  // ─── Collection ───────────────────────────────────────────────────────────

  const toggleCollection = async () => {
    try {
      if (isCollected) {
        await api.delete(`/api/collection/${vocabDetail.id}`);
        gameToast.info("Dihapus dari koleksi");
      } else {
        await api.post("/api/collection", { vocabId: vocabDetail.id });
        gameToast.success("Ditambahkan ke koleksi");
      }
      setIsCollected(!isCollected);
    } catch {
      gameToast.error("Gagal update koleksi");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
  <div className="auth-page px-4 py-4 min-vh-100 d-flex flex-column align-items-center">
    
    {/* HEADER ACTIONS (Minimalis) */}
    <div className="w-100 d-flex justify-content-between mb-4">
      <button 
        className="btn p-0 btn-link text-decoration-none text-muted fw-bold d-flex align-items-center"
        onClick={() => navigate("/")} // Asumsi kembali ke Home
      >
        <ArrowLeft size={18} className="me-2" /> Kembali
      </button>
    </div>

    {/* CONTAINER UTAMA (Kamera + Action Bar) */}
    <div className="w-100 d-flex flex-column align-items-center justify-content-center flex-grow-1">
      
      {/* 1. JUDUL DI ATAS (Sesuai Referensi) */}
      <h3 className="fw-bold text-center mb-4 text-uppercase">FOTO OBJEK!</h3>

      {/* 2. CAMERA CARD (Bentuk Card seperti sebelumnya, di tengah) */}
      {cameraOn && !previewMode && (
        <div className="glass-popup overflow-hidden rounded-5 shadow-lg mb-5" 
             style={{ width: "90%", maxWidth: "360px", aspectRatio: "3/4", border: '5px solid rgba(255,255,255,0.7)' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-100 h-100 object-fit-cover"
          />
          {/* SCANNING FRAME/OVERLAY */}
          <div
            className="position-absolute top-50 start-50 translate-middle"
            style={{
              width: "70%",
              aspectRatio: "1 / 1",
              border: "3px solid white",
              borderRadius: "20px",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
              pointerEvents: 'none'
            }}
          />
        </div>
      )}

      {/* 3. ACTION BAR (Tombol di Bawah, Sesuai Referensi) */}
      <div className="d-flex justify-content-between align-items-center w-100 px-3" style={{ maxWidth: '380px' }}>
          
          {/* Tombol Galeri (Kiri) */}
          <button 
            onClick={() => document.getElementById("galleryInput").click()}
            className="btn p-0 text-dark text-center"
            style={{ width: '70px', fontSize: '12px' }}
          >
            <div className="glass-card-item rounded-3 mb-1 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '60px', height: '60px', margin: '0 auto' }}>
              <ImageIcon size={30} color="#003366" />
            </div>
            galeri
          </button>

          {/* Tombol Capture (Tengah) */}
          <button 
            onClick={capturePhoto} 
            className="btn btn-light rounded-circle shadow-lg d-flex align-items-center justify-content-center"
            style={{ width: '75px', height: '75px', border: '7px solid rgba(0,0,0,0.1)', background: '#fff' }}
          >
            <div className="rounded-circle" style={{ width: '50px', height: '50px', border: '2px solid rgba(0,0,0,0.1)', background: '#fff' }}></div>
          </button>

          {/* Tombol Koleksi (Kanan) */}
          <button 
            onClick={() => navigate("/koleksi")}
            className="btn p-0 text-dark text-center"
            style={{ width: '70px', fontSize: '12px' }}
          >
            <div className="glass-card-item rounded-3 mb-1 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '60px', height: '60px', margin: '0 auto' }}>
              <Library size={30} color="#003366" />
            </div>
            koleksi
          </button>
      </div>
    </div>

    {/* Elemen Tersembunyi */}
    <input type="file" accept="image/*" className="d-none" id="galleryInput" onChange={handleGalleryChange} />
    <canvas ref={canvasRef} className="d-none" />

    {/* 1. MODAL PREVIEW MODE */}
    {previewMode && (
      <div className="glass-overlay-dark position-fixed inset-0 d-flex flex-column align-items-center justify-content-center px-4" style={{ zIndex: 1000, top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="glass-popup p-3 rounded-5 text-center shadow-lg w-100" style={{ maxWidth: '350px' }}>
          <img src={capturedImage} className="w-100 rounded-4 mb-3 border border-white border-2" alt="captured" />
          <div className="d-flex gap-2">
            <button className="btn btn-light rounded-pill w-100 fw-bold" onClick={() => { setPreviewMode(false); setCapturedImage(null); }}>🔄 Ulangi</button>
            <button className="btn btn-primary rounded-pill w-100 fw-bold" onClick={handleUsePhoto}>✔ Gunakan</button>
          </div>
        </div>
      </div>
    )}

    {/* 2. MODAL QUIZ (Glassmorphism) */}
    {showQuiz && quiz && (
      <div className="glass-overlay-dark position-fixed inset-0 d-flex align-items-center justify-content-center px-4" style={{ zIndex: 1100, top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="glass-popup p-4 rounded-5 w-100 text-center shadow-lg" style={{ maxWidth: '360px' }}>
          <span className="badge bg-primary mb-2 rounded-pill px-3">Mini Quiz!</span>
          <h4 className="fw-bold mb-4">{quiz.question}</h4>
          <div className="d-flex flex-column">
            {["A", "B", "C", "D"].map((opt) => (
              <button key={opt} className="btn glass-quiz-btn" onClick={() => handleAnswer(opt)}>
                {quiz[`option_${opt.toLowerCase()}`]}
              </button>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* 3. MODAL DETAIL VOCAB (Detail Card) */}
    {showVocab && vocabDetail && (
      <div className="glass-overlay-dark position-fixed inset-0 d-flex align-items-center justify-content-center px-4" style={{ zIndex: 1200, top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="glass-popup p-4 rounded-5 w-100 shadow-lg position-relative" style={{ maxWidth: '380px' }}>
          
          {/* Header Info */}
          <div className="glass-inner-content mb-3 rounded-4 p-3 text-center">
             <small className="text-muted">{vocabDetail.furigana}</small>
             <h2 className="fw-bold m-0">{vocabDetail.kanji}</h2>
             <small className="text-muted">{vocabDetail.romaji}</small>
          </div>

          {/* Captured Image */}
          <div className="mb-3 position-relative">
            <img src={vocabDetail.capturedImage} className="w-100 rounded-4 border border-white border-4 shadow-sm" alt="captured" />
            <div className="position-absolute top-0 end-0 p-2">
               <button onClick={toggleCollection} className={`btn rounded-circle shadow-sm ${isCollected ? 'btn-danger' : 'btn-light'}`} style={{ width: '45px', height: '45px' }}>
                 <i className={`bi ${isCollected ? 'bi-heart-fill' : 'bi-heart'}`}></i> 
                 {/* Kamu bisa pakai icon heart/star untuk koleksi */}
                 {isCollected ? '★' : '☆'}
               </button>
            </div>
          </div>

          {/* Content Info */}
          <div className="glass-inner-content rounded-4 p-3 shadow-sm mb-3">
            <h6 className="fw-bold small mb-1">Definisi:</h6>
            <p className="small mb-3 text-dark"><strong>{vocabDetail.definition}</strong></p>
            
            <h6 className="fw-bold small mb-1">Contoh:</h6>
            <div className="d-flex flex-column gap-1">
              <small className="fst-italic opacity-75">{vocabDetail.example_furigana}</small>
              <small className="fw-medium text-primary small">{vocabDetail.example_romaji}</small>
              <small className="text-dark small">{vocabDetail.example_id}</small>
            </div>
          </div>

          <button className="btn btn-dark w-100 rounded-pill fw-bold" onClick={() => setShowVocab(false)}>Selesai</button>
        </div>
      </div>
    )}
  </div>
);
}