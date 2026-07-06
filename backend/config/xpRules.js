// BUAT NGATUR ACTIVITY APA SAJA DAN REWARDSNYA BERAPA. 
// SEMUA REWARD XP HARUS DIATUR DI SINI.

const xpRules = {
  CLASSIFY: 3, // klasifikasi (xp sekali sehari, achievement increment)
  QUIZ_CORRECT: 5, // benar pertama per pertanyaan (xp sekali selamanya, achievement increment)
  QUIZ_INCORRECT: -3, // salah sebelum benar pertama per pertanyaan (xp decrement sebelum benar pertama, achievement tidak.)
  MISSION: 10, // misi harian (misi)
  SR_CORRECT: 3,    // spaced repetition jawab benar (xp tiap sesi review)
  SR_INCORRECT: -2  // spaced repetition jawab salah (xp decrement, tidak boleh < 0)
};

module.exports = xpRules;