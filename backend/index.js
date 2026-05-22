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

// middleware
// app.use(cors());
// app.use(cors({origin: 'http://192.168.1.12:5173',credentials: true}));
app.use(cors({origin: 
  process.env.FRONTEND_URL,
  // 'https://192.168.1.4:5173', 
  credentials: true}));
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

// routes
app.use('/auth', require('./routes/auth.js'));
app.use('/api/profile', authMiddleware, require('./routes/profile.js'));
app.use('/api/leaderboard', authMiddleware, require('./routes/leaderboard.js'));
app.use('/api/achievements', authMiddleware, require('./routes/achievement.js'));
app.use('/api/mission', authMiddleware, require('./routes/mission.js'));
app.use('/api/collection', authMiddleware, require('./routes/collection.js'));
app.use('/api/quiz', authMiddleware, require('./routes/quiz.js'));
app.use('/api/classify', authMiddleware, require('./routes/classify.js'));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});