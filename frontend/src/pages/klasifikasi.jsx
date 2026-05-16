import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { gameToast } from "../components/gameToast";
import { FolderOpen, Camera, X, Star, StarOff, ArrowLeft, Library, ImageIcon, PackagePlus, PackageX } from "lucide-react";
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
      console.log(vocab)
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
  <div className="py-3">
    <div className="glass-container rounded-4 p-3">
      <div className="w-100 d-flex flex-column">

        {/* 1. JUDUL */}
        <h5 className="fw-bold text-center">Cari Objek!</h5>

        {/* 2. CAMERA CARD */}
        {cameraOn && !previewMode && (
          <div
            className="glass-popup overflow-hidden rounded-3 shadow-lg mb-4 w-100"
            style={{ maxWidth: "360px", position: "relative" }}
          >
            <video
              ref={videoRef} autoPlay playsInline muted
              className="w-100 d-block"
              style={{ objectFit: "cover" }}
            />
            {/* SCANNING OVERLAY */}
            <div
              className="position-absolute top-50 start-50 translate-middle"
              style={{
                width: "70%",
                aspectRatio: "1 / 1",
                border: "3px solid white",
                borderRadius: "20px",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
                pointerEvents: "none",
              }}
            />
          </div>
        )}

        {/* 3. ACTION BAR */}
        <div
          className="d-flex justify-content-between align-items-center w-100"
          style={{ maxWidth: "380px" }}
        >
          {/* Galeri */}
          <button
            onClick={() => document.getElementById("galleryInput").click()}
            className="btn p-0 text-dark text-center"
            style={{ width: "70px", minWidth: "60px", fontSize: "12px" }}
          >
            <div
              className="glass-card-item rounded-3 mb-1 d-flex align-items-center justify-content-center shadow-sm mx-auto"
              style={{ width: "clamp(44px, 12vw, 60px)", height: "clamp(44px, 12vw, 60px)" }}
            >
              <ImageIcon size={24} />
            </div>
            galeri
          </button>

          {/* Capture */}
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ padding: "12px" }}
          >
            <button
              onClick={capturePhoto}
              className="btn rounded-circle p-0 flex-shrink-0 bg-white"
              style={{
                width: "clamp(44px, 14vw, 60px)",
                height: "clamp(44px, 14vw, 60px)",
                border: "none",
                outline: "4px solid white",
                outlineOffset: "7px",
              }}
            />
          </div>

          {/* Koleksi */}
          <button
            onClick={() => navigate("/koleksi")}
            className="btn p-0 text-dark text-center"
            style={{ width: "70px", minWidth: "60px", fontSize: "12px" }}
          >
            <div
              className="glass-card-item rounded-3 mb-1 d-flex align-items-center justify-content-center shadow-sm mx-auto"
              style={{ width: "clamp(44px, 12vw, 60px)", height: "clamp(44px, 12vw, 60px)" }}
            >
              <Library size={24} />
            </div>
            koleksi
          </button>
        </div>
      </div>
    </div>

    <input type="file" accept="image/*" className="d-none" id="galleryInput" onChange={handleGalleryChange} />
    <canvas ref={canvasRef} className="d-none" />




    {/* 1. MODAL PREVIEW MODE */}
    {previewMode && (
      <div
        className="glass-overlay position-fixed top-0 start-0 w-100 h-100"
        style={{
          zIndex: 1100,
          overflowY: 'auto',
          padding: '24px 0',
        }}
        onClick={() => { setPreviewMode(false); setCapturedImage(null); }}
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
            
            {/* CONTENT */}
            <div className="p-4 text-center">
              <div className="mb-3 bg-white p-3 rounded-4"><h5 className="m-0 fw-bold text-black">Pratinjau Tangkapan</h5></div>
              
              <img src={capturedImage} className="w-100 rounded-4 mb-3 border border-white border-4" alt="captured" />
              <div className="d-flex gap-2">
                <button className="bg-danger text-white btn glass-nav-btn w-100 rounded-pill shadow-sm" onClick={() => { setPreviewMode(false); setCapturedImage(null); }}>Ulangi</button>
                <button className="bg-success text-white btn glass-nav-btn w-100 rounded-pill shadow-sm" onClick={handleUsePhoto}>Lanjutkan</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    )}

    {/* 2. MODAL QUIZ (Glassmorphism) */}
    {showQuiz && quiz && (
      <div
        className="glass-overlay position-fixed top-0 start-0 w-100 h-100"
        style={{
          zIndex: 1100,
          overflowY: 'auto',
          padding: '24px 0',
        }}
        onClick={() => setShowQuiz(false)}
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
          >
            
            {/* CONTENT */}
            <div className="p-4 text-center">
              <div className="bg-white rounded-4 p-3 mb-3">
                <span className="badge bg-primary rounded-pill mb-2">Kuis: Pilihan Ganda</span>
                <h4 className="fw-bold mb-0">{quiz.question}</h4>
              </div>
              <div className="d-flex flex-column gap-3 ">
                {["A", "B", "C", "D"].map((opt) => (
                  <button key={opt} className="btn rounded-4 rounded glass-popup" onClick={() => handleAnswer(opt)}>
                    {quiz[`option_${opt.toLowerCase()}`]}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    )}

    {/* 3. MODAL DETAIL VOCAB (Detail Card) */}
    {showVocab && vocabDetail && (
      <div
        className="glass-overlay position-fixed top-0 start-0 w-100 h-100"
        style={{
          zIndex: 1200,
          overflowY: 'auto',
          padding: '24px 0',
        }}
        onClick={() => setShowVocab(false)}
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
            
            {/* HEADER */}
            <div className='justify-content-between align-items-center p-4'>
              <div className="bg-white rounded-4 d-flex align-items-center justify-content-between p-3 text-center">
                <div style={{ width: '32px' }}></div>

                <div>
                  <small className="text-muted">{vocabDetail.furigana}</small>
                  <h2 className="fw-bold m-0">{vocabDetail.kanji}</h2>
                  <small className="text-muted">{vocabDetail.romaji}</small>
                </div>

                <button
                  onClick={toggleCollection}
                  className={`btn p-0 border-0 ${isCollected ? 'text-danger' : 'text-success'}`}
                  style={{ width: '32px' }}
                >
                  {isCollected ? <PackageX size={28} /> : <PackagePlus size={28} />}
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

              {/* Image */}
              <div className="mb-3">
                <img
                  src={vocabDetail.capturedImage}
                  className="w-100 rounded-4 border border-white border-4 shadow-sm bg-white"
                  alt="captured"
                  draggable="false"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>

              {/* Content */}
              <div className="bg-white rounded-4 p-3 text-start shadow-sm">
                <div className="mb-3">
                  <h6 className="fw-bold mb-1 small">Definisi:</h6>
                  <small className="small m-0 text-dark">
                    {vocabDetail.definition}
                  </small>
                </div>

                <div>
                  <h6 className="fw-bold mb-1 small">Contoh Kalimat:</h6>

                  <div className="d-flex flex-column gap-1">
                    <small>{vocabDetail.example_furigana}</small>
                    <small className="fst-italic">
                      {vocabDetail.example_romaji}
                    </small>
                    <small>{vocabDetail.example_id}</small>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="d-flex justify-content-center p-3">
              <button onClick={() => setShowVocab(false)} className="bg-white btn glass-nav-btn rounded-circle shadow-sm" >
                <X size={20} />
              </button>
            </div>

          </div>
        </div>
      </div>
    )}
  </div>
);
}