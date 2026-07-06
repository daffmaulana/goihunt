// Halaman Review — Spaced Repetition
// User menjawab kuis dari vocab koleksinya yang sudah waktunya direview

import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookCheck, CheckCircle2, XCircle, Clock, CalendarCheck } from 'lucide-react';
import { gameToast } from '../components/gameToast';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.25 } }
};

export default function Review() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);      // daftar vocab yang harus direview
  const [quizMap, setQuizMap] = useState({});  // vocabId → soal quiz
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);  // pilihan jawaban user
  const [answered, setAnswered] = useState(false);  // apakah sudah submit
  const [result, setResult] = useState(null);       // { correct, xpChange, nextReviewAt }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);  // semua vocab sudah direview
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  // Fetch antrean review hari ini
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/review');
      setQueue(res.data);

      if (res.data.length === 0) {
        setSessionDone(true);
        setLoading(false);
        return;
      }

      // Prefetch soal quiz untuk semua vocab dalam antrean
      const quizPromises = res.data.map((item) =>
        api.get(`/quiz/${item.id}`).then((r) => ({ vocabId: item.id, quiz: r.data }))
      );
      const results = await Promise.allSettled(quizPromises);
      const map = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.quiz) {
          map[r.value.vocabId] = r.value.quiz;
        }
      });
      setQuizMap(map);
    } catch (err) {
      console.error(err);
      gameToast.error('Gagal memuat sesi review');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const currentVocab = queue[currentIdx];
  const currentQuiz = currentVocab ? quizMap[currentVocab.id] : null;

  const handleAnswer = async (option) => {
    if (answered || submitting || !currentQuiz) return;
    setSelected(option);
    setAnswered(true);
    setSubmitting(true);

    try {
      const res = await api.post('/review/submit', {
        vocabId: currentVocab.id,
        quizId: currentQuiz.id,
        answer: option
      });

      setResult(res.data);

      if (res.data.correct) {
        setSessionStats((s) => ({ ...s, correct: s.correct + 1 }));
        gameToast.xp(res.data.xpChange, 'REVIEW BENAR');
      } else {
        setSessionStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
        gameToast.xp(res.data.xpChange, 'REVIEW SALAH');
      }
    } catch (err) {
      console.error(err);
      gameToast.error('Gagal menyimpan jawaban');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= queue.length) {
      setSessionDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
      setResult(null);
    }
  };

  // Pilihan jawaban: A, B, C, D
  const options = currentQuiz
    ? ['A', 'B', 'C', 'D'].map((key) => ({
        key,
        text: currentQuiz[`option_${key.toLowerCase()}`]
      }))
    : [];

  const getOptionClass = (key) => {
    if (!answered) {
      return selected === key ? 'btn-primary' : 'btn-outline-secondary';
    }
    if (key === currentQuiz?.correct_answer) return 'btn-success';
    if (key === selected && key !== currentQuiz?.correct_answer) return 'btn-danger';
    return 'btn-outline-secondary opacity-50';
  };

  // Format tanggal review berikutnya ke bahasa Indonesia
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ── Tampilan: loading ─────────────────────────────────────────────────────
  if (loading) {
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
        <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-3">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted fw-bold m-0">Memuat sesi review...</p>
        </div>
      </div>
    );
  }

  // ── Tampilan: sesi selesai ────────────────────────────────────────────────
  if (sessionDone) {
    const total = sessionStats.correct + sessionStats.incorrect;
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

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="d-flex flex-column align-items-center text-center gap-3 py-4"
        >
          <CalendarCheck size={64} className="text-primary" />

          {total === 0 ? (
            <>
              <h4 className="fw-bold">Tidak ada yang perlu direview</h4>
              <p className="text-muted">
                Semua vocab sudah dijadwalkan ulang. Kembali besok untuk sesi berikutnya!
              </p>
            </>
          ) : (
            <>
              <h4 className="fw-bold">Sesi Review Selesai!</h4>
              <p className="text-muted mb-1">
                Kamu menyelesaikan <strong>{total}</strong> vocab hari ini.
              </p>

              <div className="d-flex gap-4 justify-content-center">
                <div className="text-center">
                  <div className="fs-3 fw-bold text-success">{sessionStats.correct}</div>
                  <small className="text-muted">Benar</small>
                </div>
                <div className="text-center">
                  <div className="fs-3 fw-bold text-danger">{sessionStats.incorrect}</div>
                  <small className="text-muted">Salah</small>
                </div>
              </div>

              <p className="text-muted small">
                Vocab yang salah akan muncul kembali besok.
              </p>
            </>
          )}

          <button
            className="btn btn-primary rounded-pill px-5 fw-bold"
            onClick={() => navigate('/gamifikasi')}
          >
            Kembali ke Beranda
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Tampilan: kartu tidak punya soal quiz ─────────────────────────────────
  const noQuiz = !currentQuiz;

  // ── Tampilan: sesi berjalan ───────────────────────────────────────────────
  return (
    <div className="auth-page d-flex flex-column px-4 py-5">
      {/* Header */}
      <div className="mb-4 d-flex align-items-center justify-content-between">
        <button
          type="button"
          className="btn p-0 btn-link text-decoration-none text-muted d-flex align-items-center"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} className="me-2" />
          <span className="fw-bold">Kembali</span>
        </button>
        <span className="text-muted fw-bold small">
          {currentIdx + 1} / {queue.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="progress rounded-pill" style={{ height: '8px' }}>
          <div
            className="progress-bar bg-primary"
            style={{ width: `${((currentIdx + (answered ? 1 : 0)) / queue.length) * 100}%`, transition: 'width 0.4s ease' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Kartu vocab — sebelum jawab: hanya gambar + label (bahasa Indonesia)
                          setelah jawab: reveal kanji, furigana, romaji */}
          <div className="card border-0 shadow rounded-4 overflow-hidden mb-4">
            <div className="d-flex">
              <div className="p-3" style={{ width: '110px', flexShrink: 0 }}>
                <img
                  src={currentVocab.image_url}
                  alt={currentVocab.label}
                  className="w-100 rounded-3 object-fit-cover bg-white"
                  style={{ height: '90px' }}
                  draggable="false"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
              <div className="p-3 d-flex flex-column justify-content-center" style={{ minWidth: 0 }}>
                {answered ? (
                  /* Setelah jawab: tampilkan detail vocab */
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-muted small m-0">{currentVocab.furigana}</p>
                    <h4 className="fw-bold m-0">{currentVocab.kanji}</h4>
                    <p className="text-muted small m-0">{currentVocab.romaji}</p>
                  </motion.div>
                ) : (
                  /* Sebelum jawab: hanya tampilkan nama objek */
                  <div>
                    <p className="text-muted small m-0">Nama objek</p>
                    <h5 className="fw-bold m-0 text-capitalize">{currentVocab.label}</h5>
                    <p className="text-muted small m-0 fst-italic">Tebak kosakata Jepangnya!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Soal atau tidak ada soal */}
          {noQuiz ? (
            <div className="text-center py-4 text-muted">
              <p>Tidak ada soal untuk vocab ini.</p>
              <button className="btn btn-outline-primary rounded-pill px-4" onClick={handleNext}>
                Lewati
              </button>
            </div>
          ) : (
            <>
              {/* Pertanyaan */}
              <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
                <p className="fw-bold m-0 text-center">{currentQuiz.question}</p>
              </div>

              {/* Pilihan jawaban */}
              <div className="d-flex flex-column gap-2 mb-4">
                {options.map(({ key, text }) => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: answered ? 1 : 0.97 }}
                    className={`btn rounded-4 text-start px-4 py-3 fw-bold ${getOptionClass(key)}`}
                    onClick={() => handleAnswer(key)}
                    disabled={answered || submitting}
                  >
                    <span className="me-2 opacity-75">{key}.</span>
                    {text}
                  </motion.button>
                ))}
              </div>

              {/* Hasil jawaban */}
              <AnimatePresence>
                {answered && result && (
                  <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`card border-0 rounded-4 p-3 mb-4 ${result.correct ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      {result.correct
                        ? <CheckCircle2 size={20} className="text-success" />
                        : <XCircle size={20} className="text-danger" />
                      }
                      <span className={`fw-bold ${result.correct ? 'text-success' : 'text-danger'}`}>
                        {result.correct ? 'Jawaban Benar!' : 'Jawaban Salah'}
                      </span>
                    </div>

                    {!result.correct && (
                      <p className="small m-0 mb-2 text-muted">
                        Jawaban benar: <strong>{currentQuiz.correct_answer}. {currentQuiz[`option_${currentQuiz.correct_answer.toLowerCase()}`]}</strong>
                      </p>
                    )}

                    <div className="d-flex align-items-center gap-1 text-muted small">
                      <Clock size={14} />
                      <span>Review berikutnya: <strong>{formatDate(result.nextReviewAt)}</strong></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tombol Lanjut */}
              {answered && (
                <motion.button
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="btn btn-primary rounded-pill w-100 fw-bold py-3"
                  onClick={handleNext}
                >
                  {currentIdx + 1 >= queue.length ? 'Selesai' : 'Lanjut →'}
                </motion.button>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
