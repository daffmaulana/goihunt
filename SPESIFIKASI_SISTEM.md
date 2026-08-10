# Spesifikasi Sistem GoiHunt

> Aplikasi web pembelajaran kosakata Bahasa Jepang berbasis gamifikasi dan klasifikasi objek menggunakan kamera.

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Struktur Direktori](#4-struktur-direktori)
5. [Database](#5-database)
6. [API Endpoints](#6-api-endpoints)
7. [Autentikasi & Otorisasi](#7-autentikasi--otorisasi)
8. [Model Machine Learning](#8-model-machine-learning)
9. [Sistem Gamifikasi](#9-sistem-gamifikasi)
10. [Halaman & Komponen Frontend](#10-halaman--komponen-frontend)
11. [Validasi & Keamanan](#11-validasi--keamanan)
12. [Error Codes & Response Format](#12-error-codes--response-format)

---

## 1. Gambaran Umum

**GoiHunt** adalah aplikasi web pembelajaran kosakata Bahasa Jepang yang menggabungkan:

- **Klasifikasi objek berbasis kamera** — pengguna memotret benda di sekitar, model ML (MobileNetV2 fine-tuned) mengenali objek dan menampilkan kosakata Bahasa Jepang yang sesuai.
- **Kuis pilihan ganda** — muncul otomatis setelah klasifikasi berhasil untuk memperkuat ingatan.
- **Gamifikasi** — sistem XP, level, pencapaian (achievement/badge), misi harian, dan papan peringkat (leaderboard).
- **Koleksi vocab** — pengguna menyimpan vocab yang telah ditemukan ke koleksi pribadi.
- **Dashboard admin** — manajemen data kuis, vocab, achievement, dan pengguna.

Inferensi ML dilakukan **sepenuhnya di sisi client** menggunakan TensorFlow.js + WASM backend. Backend hanya menerima label hasil prediksi, bukan gambar.

---

## 2. Tech Stack

### Backend
| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Runtime | Node.js | — |
| Framework | Express.js | ^5.2.1 |
| Database | PostgreSQL | — |
| Driver DB | pg (node-postgres) | ^8.16.3 |
| Autentikasi | JSON Web Token (jsonwebtoken) | ^9.0.3 |
| Hash Password | bcrypt | ^6.0.0 |
| Rate Limiting | express-rate-limit | ^8.5.0 |
| Lainnya | cors, cookie-parser, dotenv, nodemon | — |

### Frontend
| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Framework | React | ^19.2.0 |
| Build Tool | Vite | ^7.2.4 |
| Routing | React Router DOM | ^7.12.0 |
| Styling | Bootstrap | ^5.3.8 |
| Animasi | Framer Motion | ^12.39.0 |
| Icons | Lucide React | ^1.14.0 |
| Toast Notifikasi | React Toastify | ^11.0.5 |
| HTTP Client | Axios | ^1.13.4 |
| Machine Learning | TensorFlow.js + WASM backend | ^4.22.0 |
| Analytics | @vercel/analytics | ^2.0.1 |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────┐
│              BROWSER (Client)           │
│                                         │
│  React SPA (Vite)                       │
│  ├── TensorFlow.js (WASM backend)       │
│  │   └── Model MobileNetV2 (fine-tuned) │
│  └── Axios HTTP Client                  │
│      └── localStorage (JWT token)       │
└──────────────┬──────────────────────────┘
               │ HTTP / REST API
               │ Authorization: Bearer <JWT>
┌──────────────▼──────────────────────────┐
│           BACKEND (Node.js)             │
│                                         │
│  Express.js Server (port 3000)          │
│  ├── Rate Limiter (global: 100 req/min) │
│  ├── CORS (origin terkonfigurasi)       │
│  ├── Auth Middleware (JWT verify)       │
│  └── Controllers                        │
│      ├── auth, profile, leaderboard     │
│      ├── achievement, mission           │
│      ├── collection, quiz, classify     │
│      └── admin                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         PostgreSQL Database             │
│  (lokal / NeonDB via DATABASE_URL)      │
└─────────────────────────────────────────┘
```

**Catatan deployment**: CORS origin saat ini dikonfigurasi hardcode di `index.js` (`https://192.168.1.11:5173`). Untuk production, nilai ini seharusnya diambil dari `process.env.FRONTEND_URL`. Begitu juga `baseURL` pada `axios.js` frontend saat ini hardcode ke `http://192.168.1.11:3000`, idealnya menggunakan `import.meta.env.VITE_API_URL`.

---

## 4. Struktur Direktori

```
React-GoiHunt/
├── backend/
│   ├── config/
│   │   ├── levelConfig.js      # Array konfigurasi threshold XP per level
│   │   └── xpRules.js          # Object aturan XP per aktivitas (CLASSIFY, QUIZ_CORRECT, dll)
│   ├── controllers/            # Logic bisnis tiap resource
│   │   ├── auth.js             # register, login, logout, forgotPassword, adminLogin
│   │   ├── profile.js          # getProfile, updateProfile, updatePassword
│   │   ├── leaderboard.js      # getLeaderboard, getLeaderboardTop3
│   │   ├── achievement.js      # getAchievements
│   │   ├── mission.js          # getMission
│   │   ├── collection.js       # getCollection, addCollection, removeCollection
│   │   ├── quiz.js             # getQuiz, submitQuiz
│   │   ├── classify.js         # getClassify
│   │   └── admin.js            # CRUD quiz, vocab, achievement, user
│   ├── middlewares/
│   │   └── auth.js             # JWT verification middleware (inject req.user)
│   ├── routes/                 # Definisi route Express
│   │   ├── auth.js             # + rate limiters per endpoint
│   │   ├── profile.js
│   │   ├── leaderboard.js
│   │   ├── achievement.js
│   │   ├── mission.js
│   │   ├── collection.js
│   │   ├── quiz.js
│   │   ├── classify.js
│   │   └── admin.js
│   ├── utils/
│   │   ├── xp.js               # addXpToUser(), upLevel()
│   │   ├── achievement.js      # checkAchievements(), incrementAchievementProgress(), syncVocabProgress()
│   │   ├── mission.js          # getTodayMission(), completeMissionIfTarget()
│   │   └── token.js            # generateAccessToken(), generateAdminToken(), generateResetToken(), hashToken()
│   ├── scripts/
│   │   ├── seed_missions.js    # Seed data daily_missions
│   │   ├── seed_vocab.js       # Seed data vocab
│   │   ├── update_created_at.js
│   │   └── update_mission_date.js
│   ├── db.js                   # PostgreSQL connection pool
│   └── index.js                # Entry point Express, mount semua route
│
└── frontend/
    ├── public/
    │   ├── avatars/            # 10 avatar SVG: bear, cat, cow, dog, panda, penguin, rabbit, tiger, whale, worm
    │   ├── badges/             # 13 badge SVG (achievement icons)
    │   ├── collections/        # 10 gambar vocab PNG referensi
    │   └── model/              # TensorFlow.js model files
    │       ├── model.json
    │       ├── group1-shard1of3.bin
    │       ├── group1-shard2of3.bin
    │       ├── group1-shard3of3.bin
    │       └── labels.txt
    └── src/
        ├── api/
        │   └── axios.js        # Factory Axios instance + interceptors (createApiInstance)
        ├── components/
        │   ├── userContext.jsx  # React Context: state user global + refreshUser()
        │   ├── gameToast.jsx    # Custom toast: success, error, info, xp
        │   ├── authGate.jsx     # Route protection guard
        │   ├── loginForm.jsx    # Form login (coba admin dulu, lalu user)
        │   ├── registerForm.jsx # Form registrasi
        │   └── admin/          # Komponen admin dashboard
        │       ├── QuizSection.jsx
        │       ├── VocabSection.jsx
        │       ├── AchievementSection.jsx
        │       ├── UserSection.jsx
        │       ├── InlineEditableTable.jsx
        │       └── ConfirmDialog.jsx
        └── pages/
            ├── auth.jsx         # Login & Register (toggle tab)
            ├── resetPassword.jsx
            ├── wrapper.jsx      # Layout utama (topbar + navbar) untuk halaman private
            ├── klasifikasi.jsx  # Halaman kamera + modal alur klasifikasi
            ├── gamifikasi.jsx   # Leaderboard preview, misi, achievement
            ├── koleksi.jsx      # Galeri vocab yang disimpan
            ├── leaderboard.jsx  # Full leaderboard
            ├── profile.jsx      # Pengaturan profil
            └── admin.jsx        # Dashboard admin
```

---

## 5. Database

Database menggunakan **PostgreSQL**. Koneksi mendukung dua mode:
- **Lokal**: `host=localhost, database=goihunt, user=postgres`
- **Cloud**: via environment variable `DATABASE_URL` dengan SSL (`rejectUnauthorized: false`)

### Skema Tabel

#### `users`
```sql
id             SERIAL PRIMARY KEY
username       VARCHAR UNIQUE NOT NULL
email          VARCHAR UNIQUE NOT NULL
password       VARCHAR NOT NULL          -- bcrypt hash (salt rounds: 10)
avatar_key     VARCHAR                   -- path lengkap: /avatars/<name>.svg
xp             INTEGER DEFAULT 0
level          INTEGER DEFAULT 1
total_classify INTEGER DEFAULT 0         -- counter untuk achievement CLASSIFY
total_quiz     INTEGER DEFAULT 0         -- counter untuk achievement QUIZ
total_mission  INTEGER DEFAULT 0         -- counter untuk achievement MISSION
total_vocab    INTEGER DEFAULT 0         -- counter untuk achievement VOCAB (sync dari user_collections)
xp_timestamp   TIMESTAMP                -- diperbarui setiap XP berubah (tiebreaker leaderboard)
created_at     TIMESTAMP DEFAULT NOW()
```

#### `vocab`
```sql
id                SERIAL PRIMARY KEY
label             VARCHAR NOT NULL       -- nama objek (en), cocok dengan label model ML
image_url         VARCHAR                -- path gambar referensi (di /public/collections/)
kanji             VARCHAR                -- tulisan kanji
furigana          VARCHAR                -- bacaan hiragana/katakana
romaji            VARCHAR                -- romanisasi
definition        TEXT                   -- definisi dalam Bahasa Indonesia
example_id        TEXT                   -- contoh kalimat (Bahasa Indonesia)
example_romaji    TEXT                   -- contoh kalimat (romaji)
example_furigana  TEXT                   -- contoh kalimat (furigana/kanji)
```

#### `quiz`
```sql
id              SERIAL PRIMARY KEY
vocab_id        INTEGER REFERENCES vocab(id)
question        TEXT NOT NULL
option_a        VARCHAR NOT NULL
option_b        VARCHAR NOT NULL
option_c        VARCHAR NOT NULL
option_d        VARCHAR NOT NULL
correct_answer  CHAR(1) NOT NULL         -- nilai: 'A', 'B', 'C', atau 'D'
```

#### `achievements`
```sql
id        SERIAL PRIMARY KEY
code      VARCHAR UNIQUE NOT NULL        -- contoh: 'classify1', 'welcome'
icon      VARCHAR                        -- path badge SVG: /badges/<code>.svg
type      VARCHAR NOT NULL               -- 'CLASSIFY' | 'QUIZ' | 'MISSION' | 'VOCAB' | 'LOGIN'
target    INTEGER NOT NULL               -- jumlah aktivitas untuk unlock
name      VARCHAR NOT NULL
deskripsi VARCHAR
```

#### `user_achievements`
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER REFERENCES users(id)
achievement_id  INTEGER REFERENCES achievements(id)
unlocked_at     TIMESTAMP DEFAULT NOW()
```

#### `user_quiz`
```sql
id        SERIAL PRIMARY KEY
user_id   INTEGER REFERENCES users(id)
vocab_id  INTEGER REFERENCES vocab(id)
quiz_id   INTEGER REFERENCES quiz(id)
-- Mencatat soal yang sudah pernah dijawab benar (tidak dapat XP lagi dari soal ini)
```

#### `user_classify`
```sql
id        SERIAL PRIMARY KEY
user_id   INTEGER REFERENCES users(id)
vocab_id  INTEGER REFERENCES vocab(id)
date      DATE NOT NULL
-- Anti-spam XP: satu vocab satu kali per hari
-- Unique constraint implisit dari query WHERE user_id + vocab_id + date
```

#### `user_collections`
```sql
id         SERIAL PRIMARY KEY
user_id    INTEGER REFERENCES users(id)
vocab_id   INTEGER REFERENCES vocab(id)
created_at TIMESTAMP DEFAULT NOW()
UNIQUE (user_id, vocab_id)
```

#### `user_missions`
```sql
id            SERIAL PRIMARY KEY
user_id       INTEGER REFERENCES users(id)
mission_date  DATE NOT NULL
-- Mencatat penyelesaian misi harian user
```

#### `daily_missions`
```sql
id           SERIAL PRIMARY KEY
date         DATE UNIQUE NOT NULL
target_item  VARCHAR NOT NULL      -- label vocab yang harus ditemukan hari ini
-- Di-generate otomatis oleh getTodayMission() jika belum ada untuk hari ini
```

#### `password_resets`
> Tabel ini masih ada di database dan dihapus pada saat `deleteUser`, namun tidak lagi digunakan secara aktif sejak mekanisme reset password disederhanakan menjadi reset langsung (no token link).

### Relasi Antar Tabel

```
users ──< user_achievements >── achievements
users ──< user_quiz          >── quiz >── vocab
users ──< user_classify      >── vocab
users ──< user_collections   >── vocab
users ──< user_missions
         daily_missions (global, bukan per-user)
         vocab (standalone, digunakan oleh daily_missions)
```

---

## 6. API Endpoints

Base URL backend dikonfigurasi melalui environment variable `VITE_API_URL` di frontend (saat ini hardcode di `axios.js`).

**Global rate limiter**: 100 request per menit per IP untuk semua endpoint.

### 6.1 Autentikasi — `/auth` (Publik)

| Method | Path | Rate Limit | Deskripsi |
|--------|------|------------|-----------|
| POST | `/auth/register` | 5 req / 5 menit | Daftar akun baru |
| POST | `/auth/login` | 5 req / 1 menit | Login user, return `accessToken` |
| POST | `/auth/logout` | — | Logout (server hanya return OK; frontend hapus token dari localStorage) |
| POST | `/auth/forgot-password` | 3 req / 10 menit | Reset password langsung ke password acak 8 karakter |
| POST | `/auth/admin-login` | 5 req / 1 menit | Login admin, return `adminToken` |

#### POST `/auth/register`
```json
// Request body
{
  "username": "string (3-20 char, a-z0-9_)",
  "email": "string (valid email)",
  "password": "string (min 8 char, harus ada huruf + angka)",
  "confirmPassword": "string"
}
// Response 201
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "avatar_key": "/avatars/bear.svg"    // dipilih random dari 10 avatar
}
```

#### POST `/auth/login`
```json
// Request body
{
  "identifier": "string (email atau username)",
  "password": "string"
}
// Response 200
{
  "accessToken": "<JWT>",
  "user": { "id": 1, "email": "...", "username": "..." }
}
```

Setelah login berhasil, `checkAchievements(userId, 'LOGIN')` dipanggil secara async untuk mengecek achievement `welcome` (tanpa await, tidak memblokir response).

#### POST `/auth/forgot-password`
```json
// Request body
{ "email": "user@example.com" }

// Response 200 — jika email terdaftar
{
  "code": "RESET_DONE",
  "message": "Password berhasil direset",
  "newPassword": "aB3xKm7P"   // password acak 8 karakter, ditampilkan langsung ke user
}
// Response 200 — jika email tidak terdaftar (anti user-enumeration)
{ "code": "RESET_DONE", "message": "Jika email terdaftar, password telah direset" }
```

Password acak menggunakan `crypto.randomBytes(8)` dengan charset `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789` (tanpa karakter ambigu seperti I, l, O, 0).

#### POST `/auth/admin-login`
```json
// Request body
{ "identifier": "string", "password": "string" }
// Dicocokkan dengan env ADMIN_USERNAME dan ADMIN_PASSWORD (plain text comparison)
// Response 200
{ "adminToken": "<JWT>" }
```

### 6.2 Profil — `/profile` (🔒 Auth Required)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/profile` | Ambil data profil user + kalkulasi progress level |
| PUT | `/profile` | Update username dan/atau avatar |
| PUT | `/profile/password` | Ganti password (butuh password lama) |

#### GET `/profile` — Response
```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "avatar_key": "/avatars/bear.svg",
  "xp": 85,
  "level": 3,
  "xp_current": 15,      // XP yang sudah dikumpulkan di level ini
  "xp_next": 80,         // Total XP dibutuhkan untuk naik ke level berikutnya
  "progress": 18.75      // Persentase progress bar (0-100), di-cap 100
}
```

Kalkulasi progress:
```
xp_current = user.xp - currentLevel.requiredXp
xp_next    = nextLevel.requiredXp - currentLevel.requiredXp
progress   = min((xp_current / xp_next) * 100, 100)
```
Jika user sudah di level maksimal, `xp_next = currentLevel.requiredXp` dan `progress = 100`.

#### PUT `/profile` — Request body
```json
{
  "username": "string (opsional, 3-20 char a-z0-9_)",
  "profileImage": "string (nama avatar tanpa path, contoh: 'cat')"
}
```
Avatar disimpan sebagai `/avatars/${profileImage}.svg`. Menggunakan `COALESCE` sehingga field yang tidak dikirim tidak di-overwrite.

#### PUT `/profile/password` — Request body
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 char, huruf + angka)",
  "confirmPassword": "string"
}
```
Jika berhasil, frontend menghapus `accessToken` dari localStorage dan redirect ke `/`. Token tidak di-invalidasi di server (stateless JWT).

### 6.3 Leaderboard — `/leaderboard` (🔒 Auth Required)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/leaderboard` | Semua user diurutkan XP DESC, tiebreaker `xp_timestamp ASC` |
| GET | `/leaderboard/top3` | Top 3 user (dipakai di preview halaman Gamifikasi) |

**Response field per user**: `id, username, avatar_key, xp, level`

Halaman leaderboard frontend juga memanggil `GET /profile` untuk menandai posisi user sendiri (`(Aku)`) di daftar.

### 6.4 Achievement — `/achievements` (🔒 Auth Required)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/achievements` | Semua achievement + status unlock milik user yang login |

Query menggunakan `LEFT JOIN user_achievements` sehingga semua achievement dikembalikan, baik yang sudah unlock maupun belum.

Response diurutkan: yang sudah unlock (berdasarkan `unlocked_at ASC`) didahulukan, yang belum unlock di belakang.
```json
[
  {
    "code": "classify1",
    "icon": "/badges/classify1.svg",
    "name": "Nama Achievement",
    "deskripsi": "Deskripsi singkat",
    "unlocked": true,
    "unlocked_at": "2025-01-01T00:00:00.000Z"
  },
  {
    "code": "classify2",
    "icon": "/badges/classify2.svg",
    "name": "...",
    "deskripsi": "...",
    "unlocked": false,
    "unlocked_at": null
  }
]
```

### 6.5 Misi Harian — `/mission` (🔒 Auth Required)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/mission` | Ambil misi hari ini + status apakah user sudah menyelesaikannya |

Jika `daily_missions` untuk hari ini belum ada, `getTodayMission()` otomatis memilih label random dari tabel `vocab` dan menyimpannya.

```json
// Response
{
  "id": 1,
  "date": "2025-01-01",
  "target_item": "laptop",
  "is_completed": false
}
```

### 6.6 Koleksi — `/collection` (🔒 Auth Required)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/collection` | Daftar vocab yang dikumpulkan user, diurutkan `created_at DESC` |
| POST | `/collection` | Tambah vocab ke koleksi |
| DELETE | `/collection/:vocabId` | Hapus vocab dari koleksi |

**POST `/collection`** — Request body: `{ "vocabId": number }`

Menggunakan `ON CONFLICT (user_id, vocab_id) DO NOTHING` sehingga aman jika dipanggil duplikat. Hanya jika ada row baru yang ter-insert (`result.rows.length > 0`), `incrementAchievementProgress(userId, 'VOCAB')` dipanggil.

**DELETE `/collection/:vocabId`** — Setelah hapus, `syncVocabProgress(userId)` dipanggil untuk menghitung ulang `total_vocab` dari COUNT tabel `user_collections` (bukan decrement — agar konsisten).

### 6.7 Kuis — `/quiz` (🔒 Auth Required)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/quiz/:vocabId` | Ambil 1 soal random untuk vocab tertentu |
| POST | `/quiz/submit` | Submit jawaban kuis |

`GET /quiz/:vocabId` menggunakan `ORDER BY RANDOM() LIMIT 1`. Mengembalikan `null` jika tidak ada soal untuk vocab tersebut — frontend menangani ini dengan melewati modal kuis.

#### POST `/quiz/submit` — Request body
```json
{
  "quizId": 5,
  "answer": "B",
  "vocabId": 3
}
```

#### POST `/quiz/submit` — Response
```json
{
  "correct": true,
  "xpChange": 5,           // angka XP yang berubah (positif/negatif/0)
  "alreadyMastered": false // true jika sudah pernah jawab benar soal ini sebelumnya
}
```

**Logic XP quiz secara lengkap**:

| Kondisi | Hasil |
|---------|-------|
| Belum pernah benar + jawab **benar** | `+5 XP`, catat di `user_quiz`, increment `total_quiz` |
| Belum pernah benar + jawab **salah** | `-3 XP`, XP tidak boleh < 0 |
| Sudah pernah benar + jawab **benar** | `xpChange = 0`, increment `total_quiz` (achievement tetap progress) |
| Sudah pernah benar + jawab **salah** | `xpChange = 0`, tidak ada efek apapun |

### 6.8 Klasifikasi — `/classify` (🔒 Auth Required)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/classify/:label` | Ambil data vocab; opsional trigger gamifikasi via query param |
| GET | `/classify/:label?classify=true` | Ambil data vocab + trigger XP/achievement/misi |

`:label` adalah string label yang cocok dengan kolom `label` di tabel `vocab` (contoh: `laptop`, `tas`).

#### Response
```json
{
  "id": 3,
  "label": "laptop",
  "image_url": "/collections/laptop.png",
  "kanji": "ノートパソコン",
  "furigana": "ノートパソコン",
  "romaji": "nooto pasokon",
  "definition": "Komputer jinjing portabel...",
  "example_id": "...",
  "example_romaji": "...",
  "example_furigana": "...",
  "collected": false,        // apakah vocab ini ada di koleksi user
  "xpChange": 3,             // 0 jika sudah classify hari ini atau classify=false
  "missionCompleted": false, // true jika misi hari ini selesai pada request ini
  "missionXpChange": 0       // +10 jika misi selesai, 0 jika tidak
}
```

**Logic XP classify** (hanya aktif jika `?classify=true`):
1. Cek `user_classify` apakah `(userId, vocab.id, today)` sudah ada
2. Jika **belum**: `+3 XP` → `incrementAchievementProgress(userId, 'CLASSIFY')` → INSERT ke `user_classify`
3. Jika **sudah**: `xpChange = 0`, tidak ada efek
4. Setelah itu `completeMissionIfTarget(userId, vocab.label)` selalu dicek:
   - Jika label cocok dengan misi hari ini DAN user belum selesaikan misi → INSERT ke `user_missions` → return `true`
   - Jika `true` → `+10 XP` + `incrementAchievementProgress(userId, 'MISSION')`

### 6.9 Admin — `/admin` (🔒 Admin Token Required)

Semua endpoint admin membutuhkan token dengan payload `{ role: 'admin' }`. Middleware yang sama (`middlewares/auth.js`) digunakan, namun admin route dipasang di `/admin` (bukan `/api/admin` — perhatikan path mounting di `index.js`).

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/admin/quiz` | Ambil semua soal kuis (`ORDER BY id`) |
| POST | `/admin/quiz` | Buat soal kuis baru |
| PUT | `/admin/quiz/:id` | Update soal kuis |
| DELETE | `/admin/quiz/:id` | Hapus soal kuis (cascade hapus `user_quiz` terkait) |
| GET | `/admin/vocab` | Ambil semua vocab (`ORDER BY id`) |
| PUT | `/admin/vocab/:id` | Update semua field vocab |
| GET | `/admin/achievements` | Ambil semua achievement (`ORDER BY id`) |
| PUT | `/admin/achievements/:id` | Update nama & deskripsi achievement |
| GET | `/admin/users` | Ambil semua user beserta semua stats |
| DELETE | `/admin/users/:id` | Hapus user (cascade manual) |

**DELETE `/admin/users/:id`** — Urutan penghapusan cascade:
```
1. DELETE FROM user_quiz         WHERE user_id = $1
2. DELETE FROM user_missions     WHERE user_id = $1
3. DELETE FROM user_achievements WHERE user_id = $1
4. DELETE FROM user_classify     WHERE user_id = $1
5. DELETE FROM password_resets   WHERE user_id = $1
6. DELETE FROM users             WHERE id = $1
```

Catatan: `user_collections` tidak dihapus secara eksplisit — perlu dipastikan ada foreign key `ON DELETE CASCADE` di database, atau ditambahkan ke urutan di atas.

**GET `/admin/users`** mengembalikan field: `id, username, email, password (hashed), created_at, avatar_key, xp, level, total_classify, total_quiz, total_mission, total_vocab, xp_timestamp`.

---

## 7. Autentikasi & Otorisasi

### JWT Token

| Token | Payload | Expiry | Storage |
|-------|---------|--------|---------|
| `accessToken` | `{ userId, email, username }` | 60 menit | `localStorage` |
| `adminToken` | `{ role: 'admin' }` | 60 menit | `localStorage` |

Kedua token menggunakan secret yang sama (`JWT_SECRET`) dan dikirim via header `Authorization: Bearer <token>`.

### Auth Middleware (`middlewares/auth.js`)
1. Cek keberadaan header `Authorization`
2. Validasi format `Bearer <token>`
3. `jwt.verify()` dengan `JWT_SECRET`
4. Inject `req.user` = payload decoded
5. Jika gagal → `401 Unauthorized`

Middleware ini dipakai untuk semua route non-publik termasuk admin. Pembeda admin hanya dari payload `role: 'admin'` (saat ini tidak divalidasi eksplisit di middleware — semua JWT valid bisa akses admin route jika tahu path-nya).

### Axios Instances (Frontend — `api/axios.js`)

`createApiInstance(tokenType)` adalah factory yang menghasilkan instance Axios dengan interceptors:

- **Request interceptor**: Otomatis tambahkan `Authorization: Bearer <token>` dari localStorage
- **Response interceptor**: Jika status `401` dan bukan dari auth endpoint → hapus token dari localStorage → redirect ke `/auth`

Dua instance yang di-export:
- `api` — menggunakan `accessToken` (untuk semua halaman user)
- `adminApi` — menggunakan `adminToken` (untuk dashboard admin)

### Reset Password Flow
```
1. User submit email → POST /auth/forgot-password
2. Backend validasi format email
3. Query ke DB: apakah email terdaftar?
4. Jika tidak terdaftar → return response generik (anti user-enumeration)
5. Jika terdaftar:
   a. Generate password acak 8 karakter via crypto.randomBytes(8)
   b. Map bytes ke charset aman (huruf+angka, tanpa karakter ambigu)
   c. Hash password baru dengan bcrypt (salt 10)
   d. UPDATE users SET password = hashed WHERE id = userId
   e. Return { code: 'RESET_DONE', newPassword: "..." }
6. Frontend tampilkan password baru ke user
7. User dihimbau segera ganti password setelah login
```

### Login Admin Flow (Frontend — `loginForm.jsx`)
```
1. Submit form → coba POST /auth/admin-login
2. Jika berhasil (200):
   a. Simpan adminToken ke localStorage
   b. Redirect ke /admin
3. Jika gagal (401):
   a. Coba POST /auth/login sebagai user biasa
   b. Jika berhasil → simpan accessToken → redirect ke home
   c. Jika gagal → tampilkan error
```

---

## 8. Model Machine Learning

### Spesifikasi Model
| Atribut | Nilai |
|---------|-------|
| Arsitektur | MobileNetV2 (fine-tuned / transfer learning) |
| Framework serving | TensorFlow.js (LayersModel format) |
| Backend inferensi | WASM (`@tensorflow/tfjs-backend-wasm`) |
| WASM CDN | `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/` |
| Input size | 224 × 224 piksel |
| Input value range | -1.0 s/d 1.0 (normalisasi MobileNetV2) |
| Jumlah kelas | 11 |
| Format file | `model.json` + 3 shard `.bin` |

### Label Kelas (11 kelas)
```
ac, buku, jam, kacamata, kursi, laptop, meja, random, sepatu, tas, topi
```
`random` adalah kelas catch-all untuk "objek tidak dikenal". Jika prediksi tertinggi adalah `random`, sistem menampilkan pesan error dan tidak melanjutkan ke proses klasifikasi.

### Preprocessing Gambar (Frontend)

Dilakukan di fungsi `preprocessImage(img)` menggunakan `tf.tidy()` untuk mencegah memory leak:

```javascript
const tensor = tf.browser.fromPixels(img)   // ambil piksel dari elemen HTML
  .resizeBilinear([224, 224])                // resize ke 224x224 (Bilinear interpolation)
  .cast('float32');                          // cast ke float32

// Normalisasi MobileNetV2: (pixel / 127.5) - 1.0
const normalized = tensor.div(tf.scalar(127.5)).sub(tf.scalar(1.0));

// Tambah dimensi batch → shape [1, 224, 224, 3]
const finalTensor = normalized.expandDims(0);
```

### Inisialisasi Model

```javascript
setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/');
await tf.setBackend("wasm");
await tf.ready();

const [loadedModel, labelText] = await Promise.all([
  tf.loadLayersModel("/model/model.json"),
  fetch("/model/labels.txt").then(r => r.text())
]);
```

Model dan labels di-load secara paralel saat komponen `klasifikasi.jsx` mount. Status ditampilkan kepada user (Loading / Siap / Error).

### Parsing Prediksi

`parsePredictions(data)` menerima array confidence 11 kelas dan menghasilkan:
- `best` — kandidat dengan confidence tertinggi
- `top` — hingga 3 kandidat dengan confidence > 0% (untuk Label Picker)

### Alur Klasifikasi Lengkap
```
1. User buka halaman /klasifikasi
2. Model + labels di-load (WASM backend)
3. Kamera stream dimulai (facingMode: 'environment')
4. User ambil foto (shutter) atau upload dari galeri

5. [Shutter] Capture:
   - Center-crop persegi dari live video frame
   - Overlay guide: 60% lebar video, center-crop dari center frame
   
6. [Galeri] Upload:
   - Baca file sebagai Object URL
   - Center-crop persegi dari min(width, height) gambar
   - Revoke Object URL setelah crop

7. Tampilkan Preview Modal → user pilih "Ulangi" atau "Lanjutkan"

8. Tap "Lanjutkan" → predictImage() dipanggil:
   a. preprocessImage() → model.predict() → array 11 confidence
   b. parsePredictions() → { best, top, timeTaken }
   c. Evaluasi:
      i.  best.label === 'random' → error toast, kembali ke kamera
      ii. best.confidence >= 0.70 → classifyWithLabel(best.label)
      iii.best.confidence < 0.70 → Label Picker Modal (top-3 minus 'random')
      iv. HTTP 404 dari backend → Label Picker Modal (fallback)

9. [Label Picker] User pilih label → handleLabelPick(label) → classifyWithLabel(label)

10. classifyWithLabel(label):
    - GET /classify/:label?classify=true
    - Tampilkan XP toast jika dapat XP
    - Tampilkan misi toast jika misi selesai
    - refreshUser() untuk update topbar

11. loadQuiz(vocab.id):
    - GET /quiz/:vocabId
    - Jika ada soal → tampilkan Quiz Modal

12. Quiz Modal → user pilih jawaban → handleAnswer():
    - POST /quiz/submit
    - Tampilkan feedback warna (hijau/merah)
    - Tampilkan XP toast
    - Wait 1200ms → refreshUser() → tampilkan Vocab Detail Modal

13. Vocab Detail Modal:
    - Tampilkan kanji, furigana, romaji, definisi, contoh kalimat
    - Tampilkan foto hasil capture
    - Tampilkan confidence rate + processing time
    - Tombol simpan/hapus koleksi (POST/DELETE /collection)
```

