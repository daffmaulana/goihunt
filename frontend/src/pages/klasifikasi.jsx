import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState, useContext, useTransition } from "react";
import * as tf from "@tensorflow/tfjs";
import { gameToast } from "../components/gameToast";
import { X, Library, ImageIcon, PackagePlus, PackageX } from "lucide-react";
import api from "../api/axios";
import { UserContext } from '../components/userContext';
import { motion, AnimatePresence } from "framer-motion";

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
  const [gameLabels, setGameLabels] = useState(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const { refreshUser } = useContext(UserContext);
  const [isPending, startTransition] = useTransition();

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
  const preprocessImage = (img) =>
  tf.browser
    .fromPixels(img)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .div(127.5)
    .sub(1)
    .expandDims();

  // load model + label
  useEffect(() => {
    const loadResources = async () => {
      try {
        const [loadedModel, labelText, vocabLabelsRes] = await Promise.all([
          tf.loadGraphModel("/model/model.json"),
          fetch("/model/labels.txt").then((r) => r.text()),
          api.get("/api/classify/labels/list"),
        ]);
        modelRef.current = loadedModel;
        setModel(loadedModel);
        const cleanLabels = labelText.split("\n").map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return "";
          return trimmed
            .split(",")[0]
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
        });
        setLabels(cleanLabels);
        setGameLabels(new Set(vocabLabelsRes.data));
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
      } catch (err) {
        console.error("Camera error:", err);
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
      const res = await api.get(`/api/quiz/${vocabId}`);
      setQuiz(res.data);
      setShowQuiz(true);
    } catch (err) {
      console.error("Error load quiz:", err);
    }
  };

  // jawab kuis
  const handleAnswer = async (answer) => {
    try {
      setSelectedAnswer(answer);

      const res = await api.post("/api/quiz/submit", {
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
        setShowQuiz(false);
        setQuiz(null);
        setSelectedAnswer(null);
        setAnswerResult(null);

        setTimeout(() => {
          setVocabDetail({ ...currentVocab, capturedImage });
          setShowVocab(true);
        }, 300);
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
        .filter(({ index }) => labels[index]?.toLowerCase() !== "background")
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
            gameLabels.has(labels[index]) && Math.round(confidence * 100) > 0
        )
        .slice(0, 3)
        .map(toCandidate);

      console.log("=== ALL PREDICTIONS (Ranked) ===");
      ranked.slice(0, 20).forEach((item, idx) => {
        console.log(
          `${idx + 1}. ${labels[item.index]} → ${(item.confidence * 100).toFixed(2)}%`
        );
      });
      console.log("\n=== BEST (All Labels) ===");
      console.log(`${best?.displayName} → ${(best?.confidence * 100).toFixed(2)}%`);
      console.log("\n=== TOP-3 (Game Labels Only) ===");
      top.forEach((candidate, idx) => {
        console.log(
          `${idx + 1}. ${candidate.displayName} → ${(candidate.confidence * 100).toFixed(2)}%`
        );
      });
      console.log("================================\n");

      return { top, best };
    },
    [labels, gameLabels]
  );

  // open label confidence rendah
  const openLabelPicker = useCallback((candidates) => {
    if (candidates.length === 0) {
      gameToast.error("Objek belum tersedia di sistem");
      setPreviewMode(true);
      return false;
    }
    
    // Wrap state updates dalam transition untuk defer rendering
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
          const tensor = preprocessImage(img);
          const logits = modelRef.current.execute(tensor);
          const probabilities = tf.softmax(logits);
          const data = await probabilities.data();
          const result = parsePredictions(Array.from(data));
          tf.dispose([tensor, logits, probabilities]);
          resolve(result);
        };
      }),
    [parsePredictions]
  );

  // classify label yang terpilih
  const classifyWithLabel = async (label) => {
    const res = await api.get(`/api/classify/${label}?classify=true`);
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
    setPreviewMode(false);
    setIsLoading(true);
    let topCandidates = [];
    try {
      const result = await predictImage(capturedImage);
      if (!result?.best) {
        gameToast.error("Model belum siap");
        setPreviewMode(true);
        return;
      }
      const { best, top } = result;
      topCandidates = top;
      const needsPicker =
        best.confidence < 0.5 || !gameLabels.has(best.label);

      if (needsPicker) {
        openLabelPicker(top);
        return;
      }
      await classifyWithLabel(best.label);
    } catch (err) {
      if (err.response?.status === 404) {
        openLabelPicker(topCandidates);
      } else {
        gameToast.error("Terjadi kesalahan");
      }
    } finally {
      setIsLoading(false);
    }
  };


  // label picker
  const handleLabelPick = async (label) => {
    setShowLabelPicker(false);
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

        <h5 className="fw-bold text-center">Cari Objek!</h5>

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
            Galeri
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
              <div className="p-4 text-center">
                <div className="mb-3 bg-white p-3 rounded-4"><h5 className="m-0 fw-bold text-black">Pratinjau Tangkapan</h5></div>
                <img src={capturedImage} className="w-100 rounded-4 mb-3 border border-white border-4" alt="captured" />
                <div className="d-flex gap-2">
                  <button className="bg-danger text-white btn glass-nav-btn w-100 rounded-pill shadow-sm" onClick={retakePhoto}>Ulangi Foto</button>
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
                  {["A", "B", "C", "D"].map((opt) => (
                    <button
                      key={opt}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswer(opt)}
                      className={`btn rounded-4 rounded
                      ${
                        selectedAnswer === opt
                          ? answerResult === true
                            ? "bg-success text-white"
                            : answerResult === false
                              ? "bg-danger text-white"
                              : "glass-popup"
                          : "glass-popup"
                      }
                    `}
                    >
                      {quiz[`option_${opt.toLowerCase()}`]}
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