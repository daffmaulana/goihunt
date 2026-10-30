require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;
const authMiddleware = require('./middlewares/auth');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 * 1000 = 1 menit
  max: 100,
  message: {
    message: 'Terlalu banyak permintaan, coba lagi'
  }
});

const allowedOrigins = [
  process.env.VERCEL_URL,
  process.env.DOMAIN_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

app.get("/bangbangunbangpimpinnegeriini", (req, res) => {
  res.status(200).send("abang bangun dek");
});

// routes
app.use('/auth', require('./routes/auth.js'));
app.use('/profile', authMiddleware, require('./routes/profile.js'));
app.use('/leaderboard', authMiddleware, require('./routes/leaderboard.js'));
app.use('/achievements', authMiddleware, require('./routes/achievement.js'));
app.use('/mission', authMiddleware, require('./routes/mission.js'));
app.use('/collection', authMiddleware, require('./routes/collection.js'));
app.use('/quiz', authMiddleware, require('./routes/quiz.js'));
app.use('/classify', authMiddleware, require('./routes/classify.js'));
app.use('/admin', authMiddleware, require('./routes/admin'));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
