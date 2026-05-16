const CACHE_NAME = "model-cache-v1"; // ⬅ ganti versi ini kalau model update

const MODEL_FILES = [
  "/model/model.json",
  "/model/labels.txt",
  // tambahkan file weights, biasanya seperti ini:
  "/model/group1-shard1of2.bin",
  "/model/group1-shard2of2.bin",
//   "/model/group1-shard3of3.bin",
];

// Saat SW install — cache semua file model
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching model files...");
      return cache.addAll(MODEL_FILES);
    })
  );
  self.skipWaiting();
});

// Hapus cache lama saat versi baru aktif
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // hapus selain versi sekarang
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercept fetch — kalau ada di cache, pakai cache. Kalau tidak, fetch network
self.addEventListener("fetch", (event) => {
  const isModelFile = MODEL_FILES.some((f) => event.request.url.includes(f));
  if (!isModelFile) return; // biarkan request lain lewat normal

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        console.log("Serving from cache:", event.request.url);
        return cached;
      }
      // Tidak ada di cache — fetch lalu simpan
      return fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});