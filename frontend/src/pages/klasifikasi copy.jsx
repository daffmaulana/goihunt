import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { gameToast } from "../components/gameToast";
import { FolderOpen, Camera, X, Star, StarOff } from "lucide-react";
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
    <>
      <style>{`
        .klas-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Camera card ── */
        .klas-camera-card {
          border-radius: 24px;
          overflow: hidden;
          background: rgba(255,255,255,0.45);
          border: 1.5px solid rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(31,38,135,0.15);
          position: relative;
        }

        .klas-video-wrapper {
          position: relative;
          width: 100%;
          background: #1a2a3a;
          aspect-ratio: 4/3;
          overflow: hidden;
        }

        .klas-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Scan overlay */
        .klas-scan-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
        }

        .klas-scan-box {
          width: 60%;
          aspect-ratio: 1;
          border: 2.5px solid rgba(255,255,255,0.85);
          border-radius: 16px;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.45);
          position: relative;
        }

        .klas-corner {
          position: absolute;
          width: 22px;
          height: 22px;
          border-color: white;
          border-style: solid;
        }
        .klas-corner.tl { top:-3px; left:-3px; border-width:3px 0 0 3px; border-radius:6px 0 0 0; }
        .klas-corner.tr { top:-3px; right:-3px; border-width:3px 3px 0 0; border-radius:0 6px 0 0; }
        .klas-corner.bl { bottom:-3px; left:-3px; border-width:0 0 3px 3px; border-radius:0 0 0 6px; }
        .klas-corner.br { bottom:-3px; right:-3px; border-width:0 3px 3px 0; border-radius:0 0 6px 0; }

        .klas-scan-hint {
          color: rgba(255,255,255,0.75);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        /* Loading overlay */
        .klas-loading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          z-index: 5;
        }
        .klas-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: klas-spin 0.8s linear infinite;
        }
        .klas-loading-text {
          color: white;
          font-size: 13px;
          font-weight: 600;
        }
        @keyframes klas-spin { to { transform: rotate(360deg); } }

        /* Floating koleksi btn */
        .klas-btn-koleksi {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 4;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255,255,255,0.25);
          border: 1.5px solid rgba(255,255,255,0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: background 0.2s;
        }
        .klas-btn-koleksi:hover { background: rgba(255,255,255,0.4); }

        /* Controls row */
        .klas-controls {
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .klas-shutter {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: rgba(0,51,102,0.85);
          border: 3px solid rgba(255,255,255,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0,51,102,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .klas-shutter:active { transform: scale(0.93); box-shadow: 0 2px 8px rgba(0,51,102,0.2); }
        .klas-shutter-inner {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: white;
        }

        .klas-btn-gallery {
          position: absolute;
          right: 20px;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: rgba(255,255,255,0.6);
          border: 1.5px solid rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #003366;
          transition: background 0.2s;
        }
        .klas-btn-gallery:hover { background: rgba(255,255,255,0.85); }

        /* ── Preview mode ── */
        .klas-preview-overlay {
          position: fixed;
          inset: 0;
          background: black;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 999;
          gap: 24px;
        }

        .klas-preview-img {
          width: 75%;
          max-width: 320px;
          border-radius: 20px;
          border: 3px solid rgba(255,255,255,0.2);
        }

        .klas-preview-actions {
          display: flex;
          gap: 12px;
        }

        .klas-btn-retake {
          padding: 12px 24px;
          border-radius: 14px;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.3);
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .klas-btn-retake:hover { background: rgba(255,255,255,0.25); }

        .klas-btn-use {
          padding: 12px 28px;
          border-radius: 14px;
          background: rgba(0,51,102,0.85);
          border: 1.5px solid rgba(255,255,255,0.3);
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .klas-btn-use:hover { background: rgba(0,51,102,1); }

        /* ── Modal shared ── */
        .klas-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .klas-modal {
          width: 100%;
          max-width: 380px;
          background: rgba(255,255,255,0.78);
          border: 1.5px solid rgba(255,255,255,0.55);
          border-radius: 28px;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.2);
          padding: 20px;
        }

        /* ── Quiz modal ── */
        .klas-quiz-badge {
          display: inline-block;
          background: rgba(0,51,102,0.1);
          color: #003366;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          letter-spacing: 0.6px;
          margin-bottom: 12px;
        }

        .klas-quiz-question {
          font-size: 15px;
          font-weight: 700;
          color: #003366;
          margin-bottom: 16px;
          line-height: 1.55;
        }

        .klas-quiz-option {
          width: 100%;
          background: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(255,255,255,0.85);
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 13px;
          color: #003366;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          font-weight: 500;
          text-align: left;
          transition: background 0.15s, border-color 0.15s;
        }
        .klas-quiz-option:last-child { margin-bottom: 0; }
        .klas-quiz-option:hover { background: rgba(255,255,255,0.95); border-color: rgba(0,51,102,0.25); }
        .klas-quiz-option:active { transform: scale(0.98); }

        .klas-quiz-label {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(0,51,102,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #003366;
          flex-shrink: 0;
        }

        /* ── Vocab modal ── */
        .klas-vocab-header {
          background: white;
          border-radius: 16px;
          padding: 14px;
          text-align: center;
          margin-bottom: 12px;
        }
        .klas-vocab-furigana { font-size: 11px; color: #888; margin-bottom: 2px; }
        .klas-vocab-kanji { font-size: 28px; font-weight: 700; color: #003366; margin-bottom: 2px; }
        .klas-vocab-romaji { font-size: 13px; color: #666; }

        .klas-vocab-img {
          width: 100%;
          border-radius: 16px;
          border: 3px solid white;
          display: block;
          margin-bottom: 12px;
          object-fit: cover;
          max-height: 180px;
        }

        .klas-vocab-content {
          background: white;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 12px;
        }
        .klas-vocab-section-label {
          font-size: 10px;
          font-weight: 700;
          color: #aaa;
          letter-spacing: 0.6px;
          margin-bottom: 4px;
        }
        .klas-vocab-def {
          font-size: 13px;
          color: #333;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .klas-vocab-ex-furigana { font-size: 11px; color: #999; font-style: italic; }
        .klas-vocab-ex-romaji { font-size: 12px; color: #4a7cc7; font-weight: 500; margin: 3px 0; }
        .klas-vocab-ex-id { font-size: 12px; color: #444; }

        .klas-vocab-actions {
          display: flex;
          gap: 10px;
        }

        .klas-btn-collect {
          flex: 1;
          padding: 12px;
          border-radius: 14px;
          background: rgba(0,51,102,0.1);
          border: 1.5px solid rgba(0,51,102,0.2);
          color: #003366;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .klas-btn-collect:hover { background: rgba(0,51,102,0.18); }
        .klas-btn-collect.collected {
          background: rgba(234,179,8,0.12);
          border-color: rgba(234,179,8,0.35);
          color: #92620a;
        }

        .klas-btn-close {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(255,255,255,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #666;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .klas-btn-close:hover { background: white; }
      `}</style>

      <div className="klas-container">

        {/* ── Camera card ─────────────────────────────────────── */}
        <div className="klas-camera-card">

          {/* Video / scan area */}
          <div className="klas-video-wrapper">
            {cameraOn && !previewMode && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="klas-video"
              />
            )}

            {/* Scan overlay */}
            {cameraOn && !previewMode && (
              <div className="klas-scan-overlay">
                <div className="klas-scan-box">
                  <div className="klas-corner tl" />
                  <div className="klas-corner tr" />
                  <div className="klas-corner bl" />
                  <div className="klas-corner br" />
                </div>
                <span className="klas-scan-hint">Arahkan objek ke dalam kotak</span>
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="klas-loading-overlay">
                <div className="klas-spinner" />
                <span className="klas-loading-text">Menganalisa objek...</span>
              </div>
            )}

            {/* Floating koleksi btn */}
            <button
              className="klas-btn-koleksi"
              onClick={() => navigate("/koleksi")}
              title="Lihat Koleksi"
            >
              <FolderOpen size={18} />
            </button>
          </div>

          {/* Controls */}
          <div className="klas-controls">
            <button className="klas-shutter" onClick={capturePhoto} aria-label="Ambil foto">
              <div className="klas-shutter-inner" />
            </button>
            <button
              className="klas-btn-gallery"
              onClick={() => document.getElementById("galleryInput").click()}
              aria-label="Pilih dari galeri"
            >
              <Camera size={20} />
            </button>
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          id="galleryInput"
          onChange={handleGalleryChange}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* ── Preview mode ──────────────────────────────────────── */}
      {previewMode && (
        <div className="klas-preview-overlay">
          <img src={capturedImage} className="klas-preview-img" alt="captured" />
          <div className="klas-preview-actions">
            <button
              className="klas-btn-retake"
              onClick={() => { setPreviewMode(false); setCapturedImage(null); }}
            >
              🔄 Ulangi
            </button>
            <button className="klas-btn-use" onClick={handleUsePhoto}>
              ✔ Gunakan
            </button>
          </div>
        </div>
      )}

      {/* ── Quiz modal ────────────────────────────────────────── */}
      {showQuiz && quiz && (
        <div className="klas-modal-overlay">
          <div className="klas-modal">
            <div className="klas-quiz-badge">KUIS</div>
            <p className="klas-quiz-question">{quiz.question}</p>
            {["A", "B", "C", "D"].map((opt) => (
              <button
                key={opt}
                className="klas-quiz-option"
                onClick={() => handleAnswer(opt)}
              >
                <span className="klas-quiz-label">{opt}</span>
                {quiz[`option_${opt.toLowerCase()}`]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Vocab detail modal ────────────────────────────────── */}
      {showVocab && vocabDetail && (
        <div className="klas-modal-overlay">
          <div className="klas-modal">

            {/* Header: kanji + furigana + romaji */}
            <div className="klas-vocab-header">
              <p className="klas-vocab-furigana">{vocabDetail.furigana || "---"}</p>
              <h2 className="klas-vocab-kanji">{vocabDetail.kanji || vocabDetail.label}</h2>
              <p className="klas-vocab-romaji">{vocabDetail.romaji || "---"}</p>
            </div>

            {/* Captured image */}
            {vocabDetail.capturedImage && (
              <img
                src={vocabDetail.capturedImage}
                className="klas-vocab-img"
                alt="captured object"
              />
            )}

            {/* Definisi + contoh kalimat */}
            <div className="klas-vocab-content">
              <p className="klas-vocab-section-label">DEFINISI</p>
              <p className="klas-vocab-def">{vocabDetail.definition}</p>
              <p className="klas-vocab-section-label">CONTOH KALIMAT</p>
              <p className="klas-vocab-ex-furigana">{vocabDetail.example_furigana}</p>
              <p className="klas-vocab-ex-romaji">{vocabDetail.example_romaji}</p>
              <p className="klas-vocab-ex-id">{vocabDetail.example_ind}</p>
            </div>

            {/* Actions */}
            <div className="klas-vocab-actions">
              <button
                className={`klas-btn-collect ${isCollected ? "collected" : ""}`}
                onClick={toggleCollection}
              >
                {isCollected ? <StarOff size={16} /> : <Star size={16} />}
                {isCollected ? "Hapus Koleksi" : "Tambah Koleksi"}
              </button>
              <button
                className="klas-btn-close"
                onClick={() => setShowVocab(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

// // /klasifikasi

// import { useNavigate } from "react-router-dom";
// import { useCallback, useEffect, useRef, useState } from "react";
// import * as tf from "@tensorflow/tfjs";
// import { gameToast } from '../components/gameToast';

// import api from "../api/axios";

// // ✅ Pure function dipindah ke luar komponen — tidak di-recreate tiap render
// const preprocessImage = (img) =>
//   tf.browser
//     .fromPixels(img)
//     .resizeNearestNeighbor([224, 224])
//     .toFloat()
//     .div(127.5)
//     .sub(1)
//     .expandDims();

// // ✅ cropImageToSquare direfactor ke Promise agar bisa di-await
// const cropImageToSquare = (imageSrc) =>
//   new Promise((resolve) => {
//     const img = new Image();
//     img.src = imageSrc;
//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       const ctx = canvas.getContext("2d");
//       const size = Math.min(img.width, img.height);
//       const startX = (img.width - size) / 2;
//       const startY = (img.height - size) / 2;
//       canvas.width = size;
//       canvas.height = size;
//       ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
//       resolve(canvas.toDataURL("image/png"));
//     };
//   });

// export default function Klasifikasi() {
//   const navigate = useNavigate();

//   const [quiz, setQuiz] = useState(null);
//   const [showQuiz, setShowQuiz] = useState(false);
//   const [model, setModel] = useState(null);
//   const [cameraOn, setCameraOn] = useState(false);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [labels, setLabels] = useState([]);
//   const [previewMode, setPreviewMode] = useState(false);
//   const [showVocab, setShowVocab] = useState(false);
//   const [currentVocab, setCurrentVocab] = useState(null);
//   const [vocabDetail, setVocabDetail] = useState(null);
//   const [isCollected, setIsCollected] = useState(false);

//   const videoRef = useRef(null);
//   const streamRef = useRef(null);
//   const canvasRef = useRef(null);
//   const modelRef = useRef(null); // ref tidak kena stale closure


//   // Effect 1: load model
//   useEffect(() => {
//     const loadResources = async () => {
//       try {
//         // Load model dan labels paralel — lebih cepat dari sequential
//         const [loadedModel, labelText] = await Promise.all([
//           tf.loadGraphModel("/model/model.json"),
//           fetch("/model/labels.txt").then((res) => res.text()),
//         ]);

//         modelRef.current = loadedModel;
//         setModel(loadedModel);

//         const cleanLabels = labelText
//           .split("\n")
//           .map((line) => line.trim())
//           .filter(Boolean);
//         setLabels(cleanLabels);

//       } catch (err) {
//         console.error("Failed to load resources:", err);
//       }
//     };

//     loadResources();

//     return () => {
//       modelRef.current?.dispose();
//       modelRef.current = null;
//     };
//   }, []);






//   // Effect kamera — fokus pada stream saja
// useEffect(() => {
//   let mounted = true;
//   let localStream = null;

//   const startCamera = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "environment" },
//       });

//       if (!mounted) {
//         stream.getTracks().forEach((t) => t.stop());
//         return;
//       }

//       localStream = stream;
//       streamRef.current = stream;
//       setCameraOn(true); // ✅ render video element dulu
//     } catch (err) {
//       console.error("Camera error:", err);
//     }
//   };

//   if (!previewMode) {
//     startCamera();
//   }

//   return () => {
//     mounted = false;
//     localStream?.getTracks().forEach((t) => t.stop());
//     streamRef.current = null;
//     if (videoRef.current) videoRef.current.srcObject = null;
//     setCameraOn(false);
//   };
// }, [previewMode]);

// // Effect kecil — attach stream ke video setelah video element muncul di DOM
// useEffect(() => {
//   if (cameraOn && videoRef.current && streamRef.current) {
//     videoRef.current.srcObject = streamRef.current;
//     videoRef.current.onloadedmetadata = () => videoRef.current?.play();
//   }
// }, [cameraOn]); // jalan setelah cameraOn = true → video sudah di DOM


//   // // Effect 2: attach stream ke video saat cameraOn berubah
//   // useEffect(() => {
//   //   if (cameraOn && videoRef.current && streamRef.current) {
//   //     videoRef.current.srcObject = streamRef.current;
//   //     videoRef.current.onloadedmetadata = () => videoRef.current.play();
//   //   }
//   // }, [cameraOn]);


//   // // Effect 3: start camera, set cameraOn = true
//   // useEffect(() => {
//   //   let localStream = null;
//   //   let mounted = true;

//   //   const start = async () => {
//   //     try {
//   //       const stream = await navigator.mediaDevices.getUserMedia({
//   //         video: { facingMode: "environment" },
//   //       });

//   //       if (!mounted) {
//   //         stream.getTracks().forEach((track) => track.stop());
//   //         return;
//   //       }

//   //       localStream = stream;
//   //       streamRef.current = stream;
//   //       setCameraOn(true);
//   //     } catch (err) {
//   //       console.error("ERROR CAMERA:", err);
//   //     }
//   //   };

//   //   start();

//   //   return () => {
//   //     mounted = false;
//   //     localStream?.getTracks().forEach((track) => track.stop());
//   //     localStream = null;
//   //     streamRef.current = null;
//   //     if (videoRef.current) videoRef.current.srcObject = null;
//   //     setCameraOn(false);
//   //   };
//   // }, []);



//   // // Effect 5: re-attach stream saat previewMode berubah
//   // useEffect(() => {
//   //   if (!previewMode && cameraOn && videoRef.current && streamRef.current) {
//   //     videoRef.current.srcObject = streamRef.current;
//   //     videoRef.current.onloadedmetadata = () => videoRef.current.play();
//   //   }
//   // }, [previewMode]);

//   const loadQuiz = async (vocabId) => {
//     try {
//       const res = await api.get(`/api/quiz/${vocabId}`);
//       setQuiz(res.data);
//       setShowQuiz(true);
//     } catch (err) {
//       console.error("Error load quiz:", err);
//     }
//   };

//   const handleAnswer = async (answer) => {
//     try {
//       const res = await api.post("/api/quiz/submit", {
//         quizId: quiz.id,
//         answer,
//         vocabId: quiz.vocab_id,
//       });

//       const { correct, xpChange, alreadyMastered } = res.data;

//       if (correct && xpChange > 0) {
//         gameToast.success(`Benar! +${xpChange} XP`);
//       } else if (!correct && xpChange < 0) {
//         gameToast.error(`Salah! ${xpChange} XP`);
//       } else if (alreadyMastered) {
//         gameToast.info("Sudah pernah benar sebelumnya");
//       }

//       setVocabDetail({ ...currentVocab, capturedImage });
//       setShowVocab(true);
//       setShowQuiz(false);
//       setQuiz(null);
//     } catch (err) {
//       gameToast.error("Error submit quiz");
//     }
//   };

//   const capturePhoto = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     if (!video || !canvas) return;

//     const ctx = canvas.getContext("2d");
//     const rect = video.getBoundingClientRect();
//     const scaleX = video.videoWidth / rect.width;

//     const overlaySize = rect.width * 0.6;
//     const size = overlaySize * scaleX;
//     const startX = (video.videoWidth - size) / 2;
//     const startY = (video.videoHeight - size) / 2;

//     canvas.width = size;
//     canvas.height = size;
//     ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

//     setCapturedImage(canvas.toDataURL("image/png"));
//     setPreviewMode(true);
//   };




//   // ✅ useCallback + dependensi labels agar tidak stale closure
//   const getTopPrediction = useCallback(
//     (data) => {
//       // ✅ Hindari Math.max(...data) untuk array besar — gunakan reduce()
//       let maxIndex = 0;
//       for (let i = 1; i < data.length; i++) {
//         if (data[i] > data[maxIndex]) maxIndex = i;
//       }

//       const cleanLabel = labels[maxIndex]
//         ?.split(",")[0]
//         .trim()
//         .toLowerCase()
//         .replace(/\s+/g, "_");

//       return { label: cleanLabel, confidence: data[maxIndex] };
//     },
//     [labels]
//   );

//   // ✅ useCallback agar tidak re-create tiap render
//   const predictImage = useCallback(
//     (imageSrc) =>
//       new Promise((resolve) => {
//         if (!modelRef.current) return resolve(null);

//         const img = new Image();
//         img.src = imageSrc;
//         img.onload = async () => {
//           const tensor = preprocessImage(img);
//           const prediction = (modelRef.current).execute(tensor);
//           const data = await prediction.data();
//           const result = getTopPrediction(data);
//           tf.dispose([tensor, prediction]);
//           resolve(result);
//         };
//       }),
//     [getTopPrediction]
//   );

//   const handleUsePhoto = async () => {
//     setPreviewMode(false);

//     const result = await predictImage(capturedImage);
//     if (!result) {
//       gameToast.error("Model belum siap");
//       return;
//     }

//     const { label, confidence } = result;
//     console.log("PREDICT:", label, confidence);

//     if (confidence < 0.5) {
//       gameToast.error("Objek kurang jelas, coba lagi");
//       return;
//     }

//     try {
//       const res = await api.get(`/api/classify/${label}?classify=true`);
//       const vocab = res.data;

//       setCurrentVocab(vocab);
//       setIsCollected(vocab.collected);
//       loadQuiz(vocab.id);
//     } catch (err) {
//       if (err.response?.status === 404) {
//         gameToast.error("Objek belum tersedia di sistem");
//       } else {
//         gameToast.error("Terjadi kesalahan");
//       }
//     }
//   };

//   const handleGalleryChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     const url = URL.createObjectURL(file);
//     const croppedImage = await cropImageToSquare(url);
//     setCapturedImage(croppedImage);
//     setPreviewMode(true);
//     e.target.value = "";
//   };

//   const toggleCollection = async () => {
//     try {
//       if (isCollected) {
//         await api.delete(`/api/collection/${vocabDetail.id}`);
//         gameToast.info('Dihapus dari koleksi');
//       } else {
//         await api.post('/api/collection', {
//           vocabId: vocabDetail.id
//         });
//         gameToast.success('Ditambahkan ke koleksi');
//       }

//       setIsCollected(!isCollected);

//     } catch (err) {
//       gameToast.error('Gagal update koleksi');
//     }
//   };

//   return (
//     <>
//       <button onClick={() => navigate("/koleksi")}>Lihat Koleksi</button>

//       {/* ✅ Tombol test dihapus karena loadQuiz tanpa vocabId akan error */}

//       {showQuiz && quiz && (
//         <div
//           style={{
//             position: "",
//             inset: 0,
//             background: "rgba(0,0,0,0.5)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             marginTop: "100px"
//           }}
//         >
//           <div style={{ background: "white", padding: "20px", width: "300px" }}>
//             <h3>{quiz.question}</h3>
//             {["A", "B", "C", "D"].map((opt) => (
//               <button key={opt} onClick={() => handleAnswer(opt)}>
//                 {quiz[`option_${opt.toLowerCase()}`]}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       <input
//         type="file"
//         accept="image/*"
//         style={{ display: "none" }}
//         id="galleryInput"
//         onChange={handleGalleryChange}
//       />

//       <button onClick={() => document.getElementById("galleryInput").click()}>
//         📁 Galeri
//       </button>

//       <div>
//         {cameraOn && !previewMode && (
//           <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               muted
//               style={{ width: "100%", display: "block" }}
//             />
//             <div
//               style={{
//                 position: "absolute",
//                 top: "50%",
//                 left: "50%",
//                 width: "60%",
//                 aspectRatio: "1 / 1",
//                 transform: "translate(-50%, -50%)",
//                 border: "3px solid white",
//                 boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
//               }}
//             />
//           </div>
//         )}
//       </div>

//       <canvas ref={canvasRef} style={{ display: "none" }} />
//       <button onClick={capturePhoto}>Ambil Foto</button>

//       {previewMode && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "black",
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "center",
//             alignItems: "center",
//             zIndex: 999,
//           }}
//         >
//           <img
//             src={capturedImage}
//             style={{ width: "80%", maxWidth: "300px" }}
//             alt="captured"
//           />
//           <div style={{ marginTop: "20px" }}>
//             <button
//               onClick={() => {
//                 setPreviewMode(false);
//                 setCapturedImage(null);
//               }}
//             >
//               🔄 Ulangi
//             </button>
//             <button onClick={handleUsePhoto}>✔ Gunakan</button>
//           </div>
//         </div>
//       )}

//       {showVocab && vocabDetail && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.6)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             zIndex: 999,
//           }}
//         >
//           <div
//             style={{
//               background: "white",
//               padding: "20px",
//               borderRadius: "10px",
//               width: "300px",
//               textAlign: "center",
//             }}
//           >
//             <img
//               src={vocabDetail.capturedImage}
//               alt="captured"
//               style={{
//                 width: '60%',
//                 borderRadius: '10px'
//               }}
//             />
//             <p>{vocabDetail.furigana}</p>
//             <h2>{vocabDetail.kanji}</h2>
//             <p>{vocabDetail.romaji}</p>
//             <p><strong>{vocabDetail.definition}</strong></p>
//             <p>{vocabDetail.example_furigana}</p>
//             <p>{vocabDetail.example_ind}</p>
//             <p>{vocabDetail.example_romaji}</p>

//             {/* ⭐ BUTTON KOLEKSI */}
//             <button onClick={toggleCollection}>
//               {isCollected ? 'Hapus dari Koleksi' : 'Tambah ke Koleksi'}
//             </button>

//             <button onClick={() => setShowVocab(false)}>Tutup</button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }