// BUAT NGATUR ACTIVITY APA SAJA DAN REWARDSNYA BERAPA. 
// SEMUA REWARD XP HARUS DIATUR DI SINI.

const xpRules = {
  CLASSIFY: 3, // klasifikasi (xp sekali sehari, achievement increment)
  QUIZ_CORRECT: 5, // benar pertama per pertanyaan (xp sekali selamanya, achievement increment)
  QUIZ_INCORRECT: -3, // salah sebelum benar pertama per pertanyaan (xp decrement sebelum benar pertama, achievement tidak.)
  MISSION: 20 // misi harian (misi)
};

module.exports = xpRules;