# Catatan

# How To Start
cd backend > node index.js
cd frontend > npm run dev

# DB
Terminal: "psql -U postgres", PW: "admin"
## Query
2. \l untuk list database
3. \c goihunt untuk pindah ke database goihunt
4. \dt untuk list table
5. SELECT * FROM table; untuk get all row dari table
6. CREATE TABLE table (....) untuk create new table
7. TRUNCATE TABLE table CASCADE; untuk hapus semua isi table

# Progress
1. Login
2. Register
3. Reset Password
4. Token
5. Profile Update
6. 


# Insert Data

INSERT INTO user_vocab (user_id, vocab_id)
VALUES
(21, 1)





INSERT INTO vocab (
  label,
  image_url,
  kanji,
  furigana,
  romaji,
  pronunciation_url,
  definition,
  example_id,
  example_furigana,
  example_romaji
)
VALUES
(
  'apel',
  '/images/apel.png',
  '林檎',
  'りんご',
  'ringo',
  null,
  'apel',
  'Saya makan apel',
  'わたしはりんごをたべます',
  'watashi wa ringo o tabemasu'
),
(
  'pisang',
  '/images/pisang.png',
  'バナナ',
  'ばなな',
  'banana',
  null,
  'pisang',
  'Dia membeli pisang',
  'かれはばななをかいます',
  'kare wa banana o kaimasu'
);





INSERT INTO vocab (
  label,
  image_url,
  kanji,
  furigana,
  romaji,
  pronunciation_url,
  definition,
  example_id,
  example_romaji,
  example_furigana
)
VALUES
(
  'goldfish',
  '/collections/goldfish.png',
  '金魚',
  'きんぎょ',
  'kingyo',
  null,
  'koi',
  'koi berenang di akuarium',
  '水槽の中を泳ぐ金魚',
  'Suisō no naka o oyogu kingyo'
);



INSERT INTO quiz ( 
  vocab_id,
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer
)
VALUES
(
  15,
  'nama ikannye siape',
  'gurame',
  'iguana',
  'koi',
  'uler',
  'C'
);

INSERT INTO quiz ( 
  vocab_id,
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer
)
VALUES
(
  15,
  'Apa nama populer Axolotl dalam bahasa Jepang?',
  'Kingyo',
  'Upah Lupah',
  'Sanshouuo',
  'Koi',
  'B'
),
(
  15,
  'Bagaimana penulisan Katakana yang tepat untuk Axolotl?',
  'ウーパールーパー',
  'メキシコサラマンダー',
  'キンギョ',
  'コイ',
  'A'
),
(
  15,
  'Apa karakteristik unik dari Axolotl yang disebutkan dalam definisi?',
  'Bisa terbang',
  'Hidup di darat saat dewasa',
  'Tetap dalam fase larva sepanjang hidupnya',
  'Berubah menjadi katak',
  'C'
);