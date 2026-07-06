import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState, useContext, useTransition } from "react";
import * as tf from "@tensorflow/tfjs";
import { gameToast } from "../components/gameToast";
import { X, Library, ImageIcon, PackagePlus, PackageX, CameraOff, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { api } from '../api/axios';
import { UserContext } from '../components/userContext';
import { motion, AnimatePresence } from "framer-motion";
import '@tensorflow/tfjs-backend-wasm';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';

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
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [labelCandidates, setLabelCandidates] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [confidenceRate, setConfidenceRate] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState(null);
  const { refreshUser } = useContext(UserContext);
  const [isPending, startTransition] = useTransition();
  const [processingTime, setProcessingTime] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);

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

  // layer preprocess input raw image

  const preprocessImage = (img) => {
    return tf.tidy(() => {
      // Ubah gambar dari elemen HTML (img/video/canvas) menjadi tensor
      const tensor = tf.browser.fromPixels(img)
        // resize ke 224x224 dengan metode Bilinear (lebih halus)
        .resizeBilinear([224, 224])
        // ubah tipe data menjadi float32 karena kita akan melakukan pembagian
        .cast('float32');

      // normalisasi MobileNetV2 (-1 sampe 1)
      // rumus aslinya di Python: (piksel / 127.5) - 1.0
      const normalized = tensor.div(tf.scalar(127.5)).sub(tf.scalar(1.0));

      // tambah dimensi batch di awal (menjadi bentuk [1, 224, 224, 3])
      const finalTensor = normalized.expandDims(0);

      return finalTensor;
    });
  };

  // load model + label
  useEffect(() => {
    const loadResources = async () => {
      try {
        console.log("Loading model...");
        setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/');
        await tf.setBackend("wasm");
        await tf.ready();

        console.log("Backend:", tf.getBackend());

        setIsModelLoading(true);
        setModelError(null);
        setIsModelReady(false);
        
        const [loadedModel, labelText] = await Promise.all([
          tf.loadLayersModel("/model/model.json").catch(err => {
            console.error("Model loading error:", err);
            throw err;
          }),
          fetch("/model/labels.txt").then((r) => r.text()),
        ]);
        
        console.log("Model loaded successfully");
        modelRef.current = loadedModel;
        setModel(loadedModel);
        
        const cleanLabels = labelText
        .split("\n")
        
        console.log("Labels loaded:", cleanLabels);
        setLabels(cleanLabels);
        setIsModelReady(true);
        setIsModelLoading(false);
      } catch (err) {
        console.error("Failed to load resources:", err);
        const errorMsg = err.message || "Gagal load model. cek console";
        setModelError(errorMsg);
        setIsModelLoading(false);
      }
    };
    loadResources();
    return () => {
      modelRef.current?.dispose();
      modelRef.current = null;
    };
  }, []);

  // kamera stream
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
        setCameraError(null);
      } catch (err) {
        console.error("Camera error:", err);
        setCameraOn(false);
        
        // Determine the type of error
        if (err.name === "NotAllowedError") {
          setCameraError("Akses kamera ditolak. Cek pengaturan browser kamu.");
        } else if (err.name === "NotFoundError") {
          setCameraError("Kamera tidak ditemukan di perangkat ini.");
        } else if (err.name === "NotReadableError") {
          setCameraError("Kamera sedang digunakan oleh aplikasi lain.");
        } else {
          setCameraError("Gagal mengakses kamera. Gunakan galeri sebagai alternatif.");
        }
      }
    };

    if (!previewMode && !showLabelPicker) startCamera();

    return () => {
      mounted = false;
      localStream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
    };
  }, [previewMode, showLabelPicker]);

  // attach camera stream
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => videoRef.current?.play();
    }
  }, [cameraOn]);

  // kuis
  const loadQuiz = async (vocabId) => {
    try {
      const res = await api.get(`/quiz/${vocabId}`);
      setQuiz(res.data);
      const opts = ['A', 'B', 'C', 'D']
        .map((letter) => ({ letter, text: res.data[`option_${letter.toLowerCase()}`] }))
        .sort(() => Math.random() - 0.5);
      setShuffledOptions(opts);
      setShowQuiz(true);
    } catch (err) {
      console.error("Error load quiz:", err);
    }
  };

  // jawab kuis
  const handleAnswer = async (answer) => {
    try {
      setSelectedAnswer(answer);

      const res = await api.post("/quiz/submit", {
        quizId: quiz.id,
        answer,
        vocabId: quiz.vocab_id,
      });

      const { correct, xpChange, alreadyMastered } = res.data;

      setAnswerResult(correct);
      
      if (alreadyMastered) {
        gameToast.xp(xpChange, "PERTANYAAN SUDAH PERNAH TERJAWAB BENAR");
      } else if (xpChange > 0) {
        gameToast.xp(xpChange, "KUIS BENAR");
      } else if (xpChange < 0) {
        gameToast.xp(xpChange, "KUIS SALAH");
      }

      setTimeout(async () => {
        await refreshUser();
        
        const vocabData = { ...currentVocab, capturedImage };
        
        setVocabDetail(vocabData);
        setShowQuiz(false); 
        setQuiz(null);
        setSelectedAnswer(null);
        setAnswerResult(null);
        setShuffledOptions([]);
        
        setTimeout(() => {
          setShowVocab(true); 
        }, 200);

      }, 1200);
      
    } catch {
      gameToast.error("Error submit quiz");
    }
  };

  // shutter camera
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

  // ambil prediksi
  const parsePredictions = useCallback(
    (data) => {
      const ranked = data
        .map((confidence, index) => ({ index, confidence }))
        .sort((a, b) => b.confidence - a.confidence);

      const toCandidate = ({ index, confidence }) => ({
        label: labels[index],
        displayName: labels[index].replace(/_/g, " "),
        confidence,
      });

      const best = ranked[0] ? toCandidate(ranked[0]) : null;

      const top = ranked
        .filter(
          ({ index, confidence }) =>
            Math.round(confidence * 100) > 0
        )
        .slice(0, 3)
        .map(toCandidate);

      console.log("=== ALL PREDICTIONS (Ranked) ===");
      ranked.slice(0, 10).forEach((item, idx) => {
        console.log(`${idx + 1}. ${labels[item.index]} → ${(item.confidence * 100).toFixed(2)}%`
        );
      });
      console.log("\n=== BEST (All Labels) ===");
      console.log(`${best?.displayName} → ${(best?.confidence * 100).toFixed(2)}%`);
      console.log("=== TOP-3 ===");
      top.forEach((candidate, idx) => {
        console.log(
          `${idx + 1}. ${candidate.displayName} → ${(candidate.confidence * 100).toFixed(2)}%`
        );
      });
      console.log("================================\n");

      return { top, best };
    },
    [labels]
  );

  // open label confidence rendah
  const openLabelPicker = useCallback((candidates) => {
    if (candidates.length === 0) {
      gameToast.error("Objek belum tersedia di sistem");
      setPreviewMode(true);
      return false;
    }
    
    startTransition(() => {
      setLabelCandidates(candidates); 
      setShowLabelPicker(true);
    });
    
    return true;
  }, []);

  // process input buat predict
  const predictImage = useCallback(
    (imageSrc) =>
      new Promise((resolve) => {
        if (!modelRef.current) return resolve(null);
        const img = new Image();
        img.src = imageSrc;
        img.onload = async () => {
          const startTime = performance.now();
          const tensor = preprocessImage(img);
          const predictions = modelRef.current.predict(tensor);
          const data = await predictions.data();
          const result = parsePredictions(Array.from(data));
          tf.dispose([tensor, predictions]);
          const endTime = performance.now();
          const timeTaken = endTime - startTime;
          resolve({ ...result, timeTaken });
        };
      }),
    [parsePredictions]
  );

  // classify label yang terpilih
  const classifyWithLabel = async (label) => {
    const res = await api.get(`/classify/${label}?classify=true`);
    const vocab = res.data;
    if (vocab.xpChange > 0) 
      {gameToast.xp(vocab.xpChange, `BERHASIL CARI ${vocab.label.toUpperCase()} HARI INI`);
    }
    if (vocab.missionCompleted) 
      { gameToast.xp(vocab.missionXpChange, "MISI HARI INI SELESAI");
    }
    await refreshUser();
    setCurrentVocab(vocab);
    setIsCollected(vocab.collected);
    loadQuiz(vocab.id);
  };

  // confirm lanjutkan dari modal preview
  const handleUsePhoto = async () => {
    setIsLoading(true);
    let topCandidates = [];
    try {
      const result = await predictImage(capturedImage);
      if (!result?.best) {
        gameToast.error("Model belum siap");
        setPreviewMode(true);
        return;
      }
      const { best, top, timeTaken } = result;

      if (timeTaken) {
        setProcessingTime(timeTaken);
      }

      topCandidates = top;
      console.log("BEST PREDICTION:", {
        label: best.label,
        confidence: best.confidence,
        percentage: (best.confidence * 100).toFixed(2) + "%"
      });

      const UNKNOWN_THRESHOLD = 0.70;
      const PICKER_THRESHOLD = 0.90;
      
      // confidence < 70% → Tolak || 0 - 69.49
      // 70% ≤ confidence < 90% → Label Picker || 69.5 - 89.49
      // confidence ≥ 90% → Terima || 89.5 - 100

      if (best.confidence < UNKNOWN_THRESHOLD) {
        gameToast.error("Maaf, objek terdeteksi tidak dikenal");
        setPreviewMode(false);
        setIsLoading(false);
        return;
      }

      const needsPicker = best.confidence < PICKER_THRESHOLD;
      console.log("butuh picker?", needsPicker, `(confidence ${(best.confidence * 100).toFixed(1)}% < ${PICKER_THRESHOLD * 100}%)`);

      if (needsPicker) {
        console.log("confidence terlalu rendah, buka picker");
        setPreviewMode(false);
        openLabelPicker(top);
        return;
      }
      console.log("confidence tinggi, classify dengan label:", best.label);
      setConfidenceRate(best.confidence);
      setPreviewMode(false);
      await classifyWithLabel(best.label);
    } catch (err) {
      console.log("ERROR:", err.response?.status, err.message);
      if (err.response?.status === 404) {
        console.log("Label tidak ada di database, buka picker dengan top candidates");
        setPreviewMode(false);
        openLabelPicker(topCandidates);
      } else {
        gameToast.error("Terjadi kesalahan");
        setPreviewMode(true);
      }
    } finally {
      setIsLoading(false);
    }
  };


  // label picker
  const handleLabelPick = async (label) => {
    setShowLabelPicker(false);
    const selected = labelCandidates.find(c => c.label === label);
    if (selected) setConfidenceRate(selected.confidence);
    setLabelCandidates([]);
    setIsLoading(true);
    try {
      await classifyWithLabel(label);
    } catch (err) {
      if (err.response?.status === 404) gameToast.error("Objek belum tersedia di sistem");
      else gameToast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  // tombol retake
  const retakePhoto = () => {
    setShowLabelPicker(false);
    setLabelCandidates([]);
    setPreviewMode(false);
    setCapturedImage(null);
    setConfidenceRate(null);
    setProcessingTime(null);
  };

  // crop dari input galeri
  const cropGaleri = (imageSrc) =>
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
  
  // input galeri
  const handleGalleryChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const croppedImage = await cropGaleri(url);
    URL.revokeObjectURL(url);
    setCapturedImage(croppedImage);
    setPreviewMode(true);
    e.target.value = "";
  };

  // tombol koleksi di modal detail
  const toggleCollection = async () => {
    try {
      if (isCollected) {
        await api.delete(`/collection/${vocabDetail.id}`);
        gameToast.info("Dihapus dari koleksi");
      } else {
        await api.post("/collection", { vocabId: vocabDetail.id });
        gameToast.success("Ditambahkan ke koleksi");
      }
      setIsCollected(!isCollected);
    } catch {
      gameToast.error("Gagal update koleksi");
    }
  };
  return (
  <div className="py-3">
    
    {/* Main Page */}
    <motion.div 
        className="glass-container rounded-4 p-3"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
      <div className="w-100 d-flex flex-column">

        <h5 className="fw-bold text-center m-0">Cari Objek!</h5>
        <small className="text-muted text-center text-small m-2">Pastikan cahaya ideal, objek memenuhi garis batas, dan posisi dari depan.</small>

        {cameraOn && !previewMode && !showLabelPicker && (
          <div
            className="glass-popup overflow-hidden rounded-3 shadow-lg mb-4 w-100"
            style={{ maxWidth: "360px", position: "relative" }}
          >
            <video
              ref={videoRef} autoPlay playsInline muted
              className="w-100 d-block"
              style={{ objectFit: "cover" }}
            />
            
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

        {cameraError && !previewMode && !showLabelPicker && (
          <div
            className="glass-popup overflow-hidden rounded-3 shadow-lg mb-4 w-100 d-flex align-items-center justify-content-center"
            style={{ maxWidth: "360px", position: "relative", height: "280px", background: "rgba(255, 107, 107, 0.1)", border: "2px solid rgba(255, 107, 107, 0.5)" }}
          >
            <div className="text-center px-3">
              <div style={{ marginBottom: "12px" }}>
                <CameraOff size={48} className="text-muted" style={{ margin: "0 auto", display: "block" }} />
              </div>
              <p className="text-muted mb-2" style={{ fontSize: "14px", fontWeight: "500" }}>
                {cameraError}
              </p>
              <small className="text-muted" style={{ fontSize: "12px" }}>
                Sebagai alternatif, gunakan fitur <strong>Galeri</strong> untuk memilih foto.
              </small>
            </div>
          </div>
        )}

        
        <div className="mb-3 d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
          {isModelLoading && (
            <>
              <Loader size={16} className="text-warning" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Status model: Loading...</span>
            </>
          )}
          {modelError && (
            <>
              <AlertCircle size={16} className="text-danger" />
              <span>Status model: Gagal dimuat</span>
            </>
          )}
          {isModelReady && !isModelLoading && (
            <>
              <CheckCircle2 size={16} className="text-success" />
              <span>Status model: Siap</span>
            </>
          )}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        <div
          className="d-flex justify-content-between align-items-center w-100"
          style={{ maxWidth: "380px" }}
        >
          {/* Galeri */}
          <button
            onClick={() => document.getElementById("galleryInput").click()}
            disabled={!isModelReady || isModelLoading}
            className="btn p-0 text-dark text-center"
            style={{ 
              width: "70px", 
              minWidth: "60px", 
              fontSize: "12px",
              opacity: !isModelReady || isModelLoading ? 0.5 : 1,
              border: "none",
            }}
            title={!isModelReady ? "Model sedang dimuat..." : "Pilih dari galeri"}
          >
            <div
              className="glass-card-item rounded-3 mb-1 d-flex align-items-center justify-content-center shadow-sm mx-auto"
              style={{ width: "clamp(44px, 12vw, 60px)", height: "clamp(44px, 12vw, 60px)" }}
            >
              <ImageIcon size={24} />
            </div>
            Galeri
          </button>

          {/* Capture */}
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ padding: "12px" }}
          >
            <button
              onClick={capturePhoto}
              disabled={!isModelReady || isModelLoading}
              className="btn rounded-circle p-0 flex-shrink-0 bg-white"
              style={{
                width: "clamp(44px, 14vw, 60px)",
                height: "clamp(44px, 14vw, 60px)",
                border: "none",
                outline: "4px solid white",
                outlineOffset: "7px",
                opacity: !isModelReady || isModelLoading ? 0.5 : 1,
              }}
              title={!isModelReady ? "Model sedang dimuat..." : "Ambil foto"}
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
            Koleksi
          </button>
        </div>
      </div>
    </motion.div>

    <input type="file" accept="image/*" className="d-none" id="galleryInput" onChange={handleGalleryChange} />
    <canvas ref={canvasRef} className="d-none" />

    {/* MODAL PREVIEW MODE */}
    <AnimatePresence>
      {previewMode && (
        <motion.div
          className="glass-overlay position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1100, overflowY: 'auto', padding: '24px 0' }}
          onClick={() => { setPreviewMode(false); setCapturedImage(null); }}
          variants={overlayFade}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="d-flex justify-content-center px-3 align-items-center" style={{minHeight: '85vh'}}>
            <motion.div
              className="glass-popup rounded-5 shadow-lg w-100 position-relative d-flex flex-column"
              style={{ maxWidth: '300px', maxHeight: '85vh' }}
              onClick={(e) => e.stopPropagation()}
              variants={fadeInUp}
            >
              <div className="p-4 text-center position-relative">
                {isLoading && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-5"
                    style={{
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="spinner-border text-warning mb-2"
                        role="status"
                        style={{ width: "40px", height: "40px" }}
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <small className="d-block text-muted">Menganalisis objek...</small>
                    </div>
                  </div>
                )}
                <div className="mb-3 bg-white p-3 rounded-4"><h5 className="m-0 fw-bold text-black">Pratinjau Tangkapan</h5></div>
                <img src={capturedImage} className="w-100 rounded-4 mb-3 border border-white border-4" alt="captured" />
                <div className="d-flex gap-2">
                  <button className="bg-danger text-white btn glass-nav-btn w-100 rounded-pill shadow-sm" onClick={retakePhoto} disabled={isLoading}>Ulangi Foto</button>
                  <button className="bg-success text-white btn glass-nav-btn w-100 rounded-pill shadow-sm" onClick={handleUsePhoto} disabled={isLoading}>
                    {isLoading ? "Memproses..." : "Lanjutkan"}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        </motion.div>
      )}

      {/* MODAL LABEL PICKER (low confidence) */}
      {showLabelPicker && labelCandidates.length > 0 && (
        <motion.div
          className="glass-overlay position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1150, overflowY: "auto", padding: "24px 0" }}
          onClick={retakePhoto}
          variants={overlayFade}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="d-flex justify-content-center px-3 align-items-center"
            style={{ minHeight: "85vh" }}
          >
            <motion.div
              className="glass-popup rounded-5 shadow-lg w-100 position-relative d-flex flex-column"
              style={{ maxWidth: "300px", maxHeight: "85vh" }}
              onClick={(e) => e.stopPropagation()}
              variants={fadeInUp}
            >
              <div className="p-4 text-center">
                <div className="mb-3 bg-white p-3 rounded-4">
                  <h5 className="m-0 fw-bold text-black">Objek Kurang Jelas</h5>
                  <small className="text-muted">Pilih yang paling mirip dengan foto kamu</small>
                </div>
                {capturedImage && (
                  <img
                    src={capturedImage}
                    className="w-100 rounded-4 mb-3 border border-white border-4"
                    alt="captured"
                  />
                )}
                <div className="d-flex flex-column gap-2 mb-3">
                  {labelCandidates.map((candidate) => (
                    <button
                      key={candidate.label}
                      className="btn rounded-4 glass-popup text-start"
                      onClick={() => handleLabelPick(candidate.label)}
                      disabled={isLoading}
                    >
                      <span className="fw-bold">{candidate.displayName}</span>
                      <small className="text-muted ms-2">
                        {Math.round(candidate.confidence * 100)}%
                      </small>
                    </button>
                  ))}
                </div>
                <button
                  className="bg-danger text-white btn glass-nav-btn w-100 rounded-pill shadow-sm"
                  onClick={retakePhoto}
                  disabled={isLoading}
                >
                  Ulangi Foto
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* MODAL QUIZ */}
      {showQuiz && quiz && (
        <motion.div
          className="glass-overlay position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1100, overflowY: 'auto', padding: '24px 0' }}
          onClick={() => setShowQuiz(false)}
          variants={overlayFade}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="d-flex justify-content-center px-3 align-items-center"
            style={{ minHeight: '85vh' }}>
            <motion.div 
              className="glass-popup rounded-5 shadow-lg w-100 position-relative d-flex flex-column"
              style={{ maxWidth: '300px', maxHeight: '85vh' }}
              onClick={(e) => e.stopPropagation()}
              variants={fadeInUp}
            >
              <div className="p-4 text-center">
                <div className="bg-white rounded-4 p-3 mb-3">
                  <span className="badge bg-primary rounded-pill mb-2">Kuis: Pilihan Ganda</span>
                  <h4 className="fw-bold mb-0">{quiz.question}</h4>
                </div>
                <div className="d-flex flex-column gap-3 ">
                  {shuffledOptions.map(({ letter, text }) => (
                    <button
                      key={letter}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswer(letter)}
                      className={`btn rounded-4 rounded
                      ${
                        selectedAnswer === letter
                          ? answerResult === true
                            ? "bg-success text-white"
                            : answerResult === false
                              ? "bg-danger text-white"
                              : "glass-popup"
                          : "glass-popup"
                      }
                    `}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* MODAL DETAIL VOCAB */}
      {showVocab && vocabDetail && (
        <motion.div
          className="glass-overlay position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1200, overflowY: 'auto', padding: '24px 0' }}
          onClick={() => setShowVocab(false)}
          variants={overlayFade}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="d-flex justify-content-center px-3 align-items-center"
          style={{minHeight: '85vh'}}>
            <motion.div
              className="glass-popup rounded-5 shadow-lg w-100 position-relative d-flex flex-column"
              style={{maxWidth: '300px', maxHeight: '85vh'}}
              onClick={(e) => e.stopPropagation()}
              variants={fadeInUp}
            >
              
                    <div style={{ fontSize: '11px' }} className="text-muted mt-1 px-4 d-flex justify-content-between">
                {confidenceRate !== null && (
                  <div>Confidence: {(confidenceRate * 100).toFixed(2)}%</div>
                )}
                {processingTime !== null && (
                  <div>Waktu: {processingTime.toFixed(0)}ms</div>
                )}
              </div>

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
                    className={`btn p-0 border-0 d-flex flex-column align-items-center ${isCollected ? 'text-danger' : 'text-success'}`}
                    style={{ width: '40px', fontSize: '10px' }}
                  >
                    {isCollected ? <PackageX size={28} /> : <PackagePlus size={28} />}
                    <span>{isCollected ? 'Hapus' : 'Koleksi'}</span>
                  </button>
                </div>  
              </div>
              
              
              
              <div className="px-4" style={{overflowY: 'auto'}}>
      
                <div className="mb-3">
                  <img
                    src={vocabDetail.capturedImage}
                    className="w-100 rounded-4 border border-white border-4 shadow-sm bg-white"
                    alt="captured"
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>

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

              <div className="d-flex justify-content-center p-3">
                <button onClick={() => setShowVocab(false)} className="bg-white btn glass-nav-btn rounded-circle shadow-sm" >
                  <X size={20} />
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