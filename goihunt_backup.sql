--
-- PostgreSQL database dump
--

\restrict toiR3OOijTscNSskU9ay2bjtnwOterapEBMj699bm9P0adCc7Hhq45gbE6krd4M

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    code text,
    icon text,
    type text,
    target integer,
    name text,
    deskripsi text
);


ALTER TABLE public.achievements OWNER TO postgres;

--
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.achievements_id_seq OWNER TO postgres;

--
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- Name: daily_missions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_missions (
    id integer NOT NULL,
    date date,
    target_item text
);


ALTER TABLE public.daily_missions OWNER TO postgres;

--
-- Name: daily_missions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_missions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_missions_id_seq OWNER TO postgres;

--
-- Name: daily_missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_missions_id_seq OWNED BY public.daily_missions.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: quiz; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz (
    id integer NOT NULL,
    vocab_id integer,
    question text,
    option_a text,
    option_b text,
    option_c text,
    option_d text,
    correct_answer character(1)
);


ALTER TABLE public.quiz OWNER TO postgres;

--
-- Name: quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_id_seq OWNER TO postgres;

--
-- Name: quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_id_seq OWNED BY public.quiz.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_achievements (
    id integer NOT NULL,
    user_id integer,
    achievement_id integer,
    unlocked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_achievements OWNER TO postgres;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_achievements_id_seq OWNER TO postgres;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;


--
-- Name: user_classify; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_classify (
    id integer NOT NULL,
    user_id integer,
    vocab_id integer,
    date date NOT NULL
);


ALTER TABLE public.user_classify OWNER TO postgres;

--
-- Name: user_classify_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_classify_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_classify_id_seq OWNER TO postgres;

--
-- Name: user_classify_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_classify_id_seq OWNED BY public.user_classify.id;


--
-- Name: user_collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_collections (
    id integer CONSTRAINT user_vocab_id_not_null NOT NULL,
    user_id integer,
    vocab_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_collections OWNER TO postgres;

--
-- Name: user_missions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_missions (
    id integer NOT NULL,
    user_id integer,
    mission_date date
);


ALTER TABLE public.user_missions OWNER TO postgres;

--
-- Name: user_missions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_missions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_missions_id_seq OWNER TO postgres;

--
-- Name: user_missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_missions_id_seq OWNED BY public.user_missions.id;


--
-- Name: user_quiz; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_quiz (
    id integer NOT NULL,
    user_id integer,
    vocab_id integer,
    quiz_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_quiz OWNER TO postgres;

--
-- Name: user_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_quiz_id_seq OWNER TO postgres;

--
-- Name: user_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_quiz_id_seq OWNED BY public.user_quiz.id;


--
-- Name: user_vocab_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_vocab_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_vocab_id_seq OWNER TO postgres;

--
-- Name: user_vocab_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_vocab_id_seq OWNED BY public.user_collections.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    avatar_key text DEFAULT 'default'::text NOT NULL,
    xp integer DEFAULT 0,
    level integer DEFAULT 1,
    total_classify integer DEFAULT 0,
    total_quiz integer DEFAULT 0,
    total_mission integer DEFAULT 0,
    total_vocab integer DEFAULT 0,
    xp_timestamp timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vocab; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vocab (
    id integer NOT NULL,
    label text,
    image_url text,
    kanji text,
    furigana text,
    romaji text,
    pronunciation_url text,
    definition text,
    example_id text,
    example_romaji text,
    example_furigana text
);


ALTER TABLE public.vocab OWNER TO postgres;

--
-- Name: vocab_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vocab_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vocab_id_seq OWNER TO postgres;

--
-- Name: vocab_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vocab_id_seq OWNED BY public.vocab.id;


--
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- Name: daily_missions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_missions ALTER COLUMN id SET DEFAULT nextval('public.daily_missions_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: quiz id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz ALTER COLUMN id SET DEFAULT nextval('public.quiz_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: user_achievements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements ALTER COLUMN id SET DEFAULT nextval('public.user_achievements_id_seq'::regclass);


--
-- Name: user_classify id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_classify ALTER COLUMN id SET DEFAULT nextval('public.user_classify_id_seq'::regclass);


--
-- Name: user_collections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_collections ALTER COLUMN id SET DEFAULT nextval('public.user_vocab_id_seq'::regclass);


--
-- Name: user_missions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_missions ALTER COLUMN id SET DEFAULT nextval('public.user_missions_id_seq'::regclass);


--
-- Name: user_quiz id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_quiz ALTER COLUMN id SET DEFAULT nextval('public.user_quiz_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vocab id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vocab ALTER COLUMN id SET DEFAULT nextval('public.vocab_id_seq'::regclass);


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.achievements (id, code, icon, type, target, name, deskripsi) FROM stdin;
11	VOCAB_1	vocab1	VOCAB	5	Pengepul Kata	Koleksi 5 objek
12	VOCAB_2	vocab2	VOCAB	10	Gemar Simpan	Koleksi 10 objek
2	MISSION_1	mission1	MISSION	1	Pemanasan Otak	Selesai 1 misi
3	MISSION_2	mission2	MISSION	5	Otak Aktif	Selesai 5 misi
4	MISSION_3	mission3	MISSION	10	Master Konsisten	Selesai 10 misi
8	QUIZ_1	quiz1	QUIZ	5	Pinter Nih	Benar 5 kuis
9	QUIZ_2	quiz2	QUIZ	10	Kok Jenius	Benar 10 kuis
1	WELCOME	welcome	LOGIN	1	Welcome	Selamat belajar!
10	QUIZ_3	quiz3	QUIZ	20	Wow Professor	Benar 20 kuis
13	VOCAB_3	vocab3	VOCAB	20	Juragan Koleksi	Koleksi 20 objek
5	CLASSIFY_1	classify1	CLASSIFY	10	Mata Jeli	Cari 10 objek
6	CLASSIFY_2	classify2	CLASSIFY	25	Pelajar Hebat	Cari 25 objek
7	CLASSIFY_3	classify3	CLASSIFY	50	Rajin Beraksi	Cari 50 objek
\.


--
-- Data for Name: daily_missions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_missions (id, date, target_item) FROM stdin;
7	2026-05-03	goldfish
8	2026-05-04	goldfish
9	2026-05-05	axolotl
10	2026-05-06	goldfish
11	2026-05-07	axolotl
12	2026-05-08	axolotl
13	2026-05-09	goldfish
14	2026-05-10	cheetah
15	2026-05-11	zebra
16	2026-05-15	goldfish
17	2026-05-16	zebra
18	2026-05-17	goldfish
19	2026-05-18	zebra
20	2026-05-19	mantis
21	2026-05-20	goldfish
22	2026-05-21	goldfish
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_resets (id, user_id, token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: quiz; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz (id, vocab_id, question, option_a, option_b, option_c, option_d, correct_answer) FROM stdin;
3	15	bahasa jepangnya?	kingyo	nihonjin	portet	supri	A
2	15	nama ikannye siape	gurame	iguana	koi	uler	C
4	16	Apa nama populer Axolotl dalam bahasa Jepang?	Kingyo	Upah Lupah	Sanshouuo	Koi	B
5	16	Bagaimana penulisan Katakana yang tepat untuk Axolotl?	ウーパールーパー	メキシコサラマンダー	キンギョ	コイ	A
6	16	Apa karakteristik unik dari Axolotl yang disebutkan dalam definisi?	Bisa terbang	Hidup di darat saat dewasa	Tetap dalam fase larva sepanjang hidupnya	Berubah menjadi katak	C
7	17	Apa sebutan untuk lebah dalam bahasa Jepang?	Hachi	Kame	Kumo	Tori	A
8	18	Berasal dari kata apakah nama "Kamakiri" (Mantis)?	Kaki dan Tangan	Sabit dan Memotong	Daun dan Hijau	Pedang dan Perisai	B
9	19	Bagaimana penulisan Katakana yang benar untuk Cheetah?	チーター	テータ	シマウマ	ヒョウ	A
10	20	Apa arti harfiah dari kata "Shimauma" (Zebra) dalam bahasa Jepang?	Kuda Putih	Kuda Lari	Kuda Bergaris	Kuda Liar	C
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
210	41	f79a51d39e738d0cc6cdbf81da8bf84ec778bed08fadb68d7fc3ab88bda1c424	2026-05-20 12:11:37.064	2026-05-19 12:11:37.065257
212	40	c256eafad251ff724c61efd8a099128d18cf8976517d2629283184ef340e1d31	2026-05-20 13:36:20.964	2026-05-19 13:36:20.964923
214	39	3d0527b93ea7a8484b43e0bf3672f0fec7ebd5776a1b4606eb930725fa0e3122	2026-05-20 14:15:00.959	2026-05-19 14:15:00.959783
216	43	307f8e3f56d356539d883e93514d9ffd5798fe24620353ef8c065391259ae8f4	2026-05-20 14:56:26.647	2026-05-19 14:56:26.648491
218	39	15bf352a79d97447d0c132a784a9cf5a2daa26a46d676650afd1508444422e8e	2026-05-21 13:14:27.35	2026-05-20 13:14:27.351717
220	39	72992aacf24af6ec021cf3822d638d31d34b3094b0b1520739325c81c45cd01f	2026-05-21 15:33:07.683	2026-05-20 15:33:07.684301
221	45	d49b3d78bf4a407ef39083eaeeeb6802141d5a3ed97abd913cf77366bd29535c	2026-05-22 07:00:59.104	2026-05-21 07:00:59.105385
223	39	61a0624719d200b5dc97b3d525b651afcc578b6bd85261ea320e7f5b4192d5a4	2026-05-22 09:23:07.503	2026-05-21 09:23:07.505222
225	39	7152d894f67c236048666745380362cafe797cc025557cd54ea1eff516a54fab	2026-05-22 14:02:05.817	2026-05-21 14:02:05.818724
227	39	c9c459d029975495d53a961e44319b44ec67ecedce2a5422454989ece55759c4	2026-05-22 17:21:20.599	2026-05-21 17:21:20.60156
229	39	924e4a42e35efd998adc1123e717e0f28a796f0abae27f90ea002c3c8b71cecd	2026-05-22 18:55:18.722	2026-05-21 18:55:18.725711
209	39	4340d22bcb1e86d7488d5accadceaa838b8fc447464e54dddd876d9270f2d336	2026-05-20 12:03:49.492	2026-05-19 12:03:49.493354
211	39	923a88b8d9ba17e8ca69c62073c6658ccef65508e0f96e1c3e272c1864d07e7b	2026-05-20 13:27:53.472	2026-05-19 13:27:53.473524
213	42	494fa702e257f21109e4d2b4307ac0c15d8b3be7ff3f6f369d1caa085b8f441f	2026-05-20 13:52:44.09	2026-05-19 13:52:44.091516
215	40	89dd46fd6944287f904c23d44de4cfe37588e5ea7a115a9b331bca3728ca2dea	2026-05-20 14:15:54.579	2026-05-19 14:15:54.579794
217	44	cf32843496301accc434eb7110ccce3b1554c9480f9252b20bdb170c7d051b01	2026-05-20 15:50:35.671	2026-05-19 15:50:35.672413
219	39	dd3b279a482c9e0a15ee1af215207cbbc68092498e9e70c73ec2c162426046c8	2026-05-21 14:59:42.443	2026-05-20 14:59:42.44541
222	46	39c49a6a1a916d8fed8defdc495cdbe514da681e5a15d2b0341765b416a41a5f	2026-05-22 09:19:07.745	2026-05-21 09:19:07.746128
224	40	6ccdd44da300d91db63a9a9235cc11f61205709ba4593b60c89bf6ba5b25e6db	2026-05-22 10:42:20.246	2026-05-21 10:42:20.248023
226	39	c3484d734d84bf61143c3d36b67fd571740e1da94ef2b52063f571d7a3573608	2026-05-22 15:03:53.926	2026-05-21 15:03:53.927551
228	45	c31ad8b5d000308787bffa9add6ff347deb2b38194be96236257643107cb52b3	2026-05-22 17:30:55.926	2026-05-21 17:30:55.927705
230	39	6d66593f0299571763d454da47317354bb1f98a251ee652df9ad65a82797c023	2026-05-22 19:05:07.435	2026-05-21 19:05:07.43605
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_achievements (id, user_id, achievement_id, unlocked_at) FROM stdin;
76	39	1	2026-05-20 13:14:27.378454
77	39	2	2026-05-20 18:54:43.907941
78	39	8	2026-05-20 19:59:14.85321
79	45	1	2026-05-21 07:00:59.133041
80	45	2	2026-05-21 07:12:50.574568
81	46	1	2026-05-21 09:19:07.777856
82	40	1	2026-05-21 10:42:20.259862
\.


--
-- Data for Name: user_classify; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_classify (id, user_id, vocab_id, date) FROM stdin;
99	39	17	2026-05-20
100	39	16	2026-05-20
101	39	15	2026-05-20
102	39	20	2026-05-20
103	39	19	2026-05-20
104	45	15	2026-05-21
105	39	16	2026-05-21
106	40	16	2026-05-21
107	45	16	2026-05-21
108	45	20	2026-05-21
109	45	18	2026-05-21
\.


--
-- Data for Name: user_collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_collections (id, user_id, vocab_id, created_at) FROM stdin;
144	39	20	2026-05-20 19:43:35.820747
145	39	19	2026-05-20 19:43:48.6522
146	39	15	2026-05-20 19:59:17.604336
147	45	15	2026-05-21 07:12:56.487258
149	45	18	2026-05-21 19:37:53.655712
\.


--
-- Data for Name: user_missions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_missions (id, user_id, mission_date) FROM stdin;
33	39	2026-05-20
34	45	2026-05-21
\.


--
-- Data for Name: user_quiz; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_quiz (id, user_id, vocab_id, quiz_id, created_at) FROM stdin;
49	39	17	7	2026-05-20 15:34:43.665819
50	39	15	3	2026-05-20 18:54:49.019866
51	39	20	10	2026-05-20 19:43:33.254317
52	39	19	9	2026-05-20 19:43:45.105239
53	39	15	2	2026-05-20 19:59:14.855699
54	45	15	3	2026-05-21 07:12:52.257166
55	40	16	4	2026-05-21 10:45:08.012445
56	45	16	6	2026-05-21 17:31:28.650563
57	45	18	8	2026-05-21 19:37:50.350015
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, created_at, avatar_key, xp, level, total_classify, total_quiz, total_mission, total_vocab, xp_timestamp) FROM stdin;
45	cantika	cantika@gmail.com	$2b$10$Te.dAc4IQid8U.MaGxv7kucsyFReS0nPbmYJwCLw.InWIZGmujaB6	2026-05-21 07:00:52.241212	panda	41	2	4	3	1	2	2026-05-21 20:05:53.280272
42	dinda	dinda@gmail.com	$2b$10$VVvq8uifES4.zZBUopqpiuNdjK9lnU3vrqM0rkPXq9sm8lQjSiLhS	2026-05-19 13:52:30.426931	cat	0	1	0	0	0	0	\N
46	putri	putri@gmail.com	$2b$10$7vIZklL6FjxmI2iKHVAM.uy0TuxpXQGkP1nHM32krv1Sio0w4YIi2	2026-05-21 07:44:39.171663	worm	0	1	0	0	0	0	\N
44	noor	noor@gmail.com	$2b$10$0ZHtllnyZ1jraG6NuMpZDOvP2wHE6Vz0pC.WtFEltlWdYC4loFSti	2026-05-19 15:50:26.167974	panda	0	1	0	0	0	0	\N
43	effi	effi@gmail.com	$2b$10$FijC0EtimFb6k.RX8c8BiONXOQpc8RUcxOyc9q8vJLraH.TrC4ePC	2026-05-19 14:56:09.68084	dog	0	1	0	0	0	0	\N
41	maulana	maulana@gmail.com	$2b$10$F/L9zdI6xh9WK2Ct4jjuTOoj80IJ5By3WCONzl5C4nEUEIcndPYMq	2026-05-19 12:11:09.734177	penguin	0	1	0	0	0	0	\N
40	bagus	bagus@gmail.com	$2b$10$uh8nJwDRWN79CDZGl7i6yuLHCJWBulxOHloubMoTb/VwD.PAs9BQO	2026-05-19 12:08:44.053483	bear	36	2	1	1	0	0	2026-05-21 10:45:08.01165
39	daffa	daffa@gmail.com	$2b$10$VJi0UyWjB8H1jv1Mvn8oJu2vD47lbTrUFyTd1auM1Nw.sk19iBBza	2026-05-19 12:03:40.628659	worm	36	2	6	5	1	3	2026-05-21 17:30:43.310673
\.


--
-- Data for Name: vocab; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vocab (id, label, image_url, kanji, furigana, romaji, pronunciation_url, definition, example_id, example_romaji, example_furigana) FROM stdin;
16	axolotl	/collections/axolotl.jpg	虎斑山椒魚	ウーパールーパー	ūpā rūpā	\N	axolotl, salamander air	axolotl itu sangat lucu	ūpā rūpā wa totemo kawaī desu	ウーパールーパーはとてもかわいいです
17	bee	/collections/bee.jpg	蜂	はち	hachi	\N	lebah, serangga pembantu penyerbukan bunga dan penghasil madu	lebah sedang mengumpulkan nektar	hachi ga mitsu o atsumete imasu	蜂が蜜を集めています
18	mantis	/collections/mantis.jpg	蟷螂	かまきり	kamakiri	\N	belalang sembah, serangga dengan tangan seperti berdoa	mantis sedang bersembunyi di balik daun	kamakiri ga happa no ura ni kakurete imasu	蟷螂が葉っぱの裏に隠れています
20	zebra	/collections/zebra.jpg	縞馬	しまうま	shimauma	\N	zebra, hewan sejenis kuda dengan corak bergaris	zebra sedang makan rumput	shimauma ga kusa o tabete imasu	縞馬が草を食べています
15	goldfish	/collections/goldfish.jpg	金魚	きんぎょ	kingyo	\N	koi, ikan hias dengan tonjolan di kepala 	koi berenang di akuarium	Suisō no naka o oyogu kingyo	水槽の中を泳ぐ金魚
19	cheetah	/collections/cheetah.jpg	猟豹	チーター	chītā	\N	cheetah, kucing besar tercepat di darat	cheetah berlari sangat cepat	chītā wa totemo hayaku hashirimasu	チーターはとても速く走ります
\.


--
-- Name: achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.achievements_id_seq', 13, true);


--
-- Name: daily_missions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_missions_id_seq', 22, true);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 22, true);


--
-- Name: quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_id_seq', 10, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 230, true);


--
-- Name: user_achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_achievements_id_seq', 82, true);


--
-- Name: user_classify_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_classify_id_seq', 109, true);


--
-- Name: user_missions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_missions_id_seq', 34, true);


--
-- Name: user_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_quiz_id_seq', 57, true);


--
-- Name: user_vocab_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_vocab_id_seq', 149, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 46, true);


--
-- Name: vocab_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vocab_id_seq', 20, true);


--
-- Name: achievements achievements_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_code_key UNIQUE (code);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: daily_missions daily_missions_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_missions
    ADD CONSTRAINT daily_missions_date_key UNIQUE (date);


--
-- Name: daily_missions daily_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_missions
    ADD CONSTRAINT daily_missions_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: quiz quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_classify user_classify_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_classify
    ADD CONSTRAINT user_classify_pkey PRIMARY KEY (id);


--
-- Name: user_missions user_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_missions
    ADD CONSTRAINT user_missions_pkey PRIMARY KEY (id);


--
-- Name: user_missions user_missions_user_id_mission_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_missions
    ADD CONSTRAINT user_missions_user_id_mission_date_key UNIQUE (user_id, mission_date);


--
-- Name: user_quiz user_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_quiz
    ADD CONSTRAINT user_quiz_pkey PRIMARY KEY (id);


--
-- Name: user_collections user_vocab_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_collections
    ADD CONSTRAINT user_vocab_pkey PRIMARY KEY (id);


--
-- Name: user_collections user_vocab_user_id_vocab_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_collections
    ADD CONSTRAINT user_vocab_user_id_vocab_id_key UNIQUE (user_id, vocab_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: vocab vocab_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vocab
    ADD CONSTRAINT vocab_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quiz quiz_vocab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_vocab_id_fkey FOREIGN KEY (vocab_id) REFERENCES public.vocab(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id);


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_classify user_classify_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_classify
    ADD CONSTRAINT user_classify_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_classify user_classify_vocab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_classify
    ADD CONSTRAINT user_classify_vocab_id_fkey FOREIGN KEY (vocab_id) REFERENCES public.vocab(id);


--
-- Name: user_quiz user_quiz_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_quiz
    ADD CONSTRAINT user_quiz_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quiz(id);


--
-- Name: user_quiz user_quiz_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_quiz
    ADD CONSTRAINT user_quiz_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_quiz user_quiz_vocab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_quiz
    ADD CONSTRAINT user_quiz_vocab_id_fkey FOREIGN KEY (vocab_id) REFERENCES public.vocab(id);


--
-- Name: user_collections user_vocab_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_collections
    ADD CONSTRAINT user_vocab_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_collections user_vocab_vocab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_collections
    ADD CONSTRAINT user_vocab_vocab_id_fkey FOREIGN KEY (vocab_id) REFERENCES public.vocab(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict toiR3OOijTscNSskU9ay2bjtnwOterapEBMj699bm9P0adCc7Hhq45gbE6krd4M

