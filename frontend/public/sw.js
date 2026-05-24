// const CACHE_NAME = "model-cache-v1"; // versi

// const MODEL_FILES = [
//   "/model/model.json",
//   "/model/labels.txt",
  
//   // file weights
//   "/model/group1-shard1of2.bin",
//   "/model/group1-shard2of2.bin",
// //   "/model/group1-shard3of3.bin",
// ];

// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       console.log("Caching model files...");
//       return cache.addAll(MODEL_FILES);
//     })
//   );
//   self.skipWaiting();
// });

// self.addEventListener("activate", (event) => {
//   event.waitUntil(
//     caches.keys().then((keys) =>
//       Promise.all(
//         keys
//           .filter((key) => key !== CACHE_NAME)
//           .map((key) => caches.delete(key))
//       )
//     )
//   );
//   self.clients.claim();
// });

// self.addEventListener("fetch", (event) => {
//   const isModelFile = MODEL_FILES.some((f) => event.request.url.includes(f));
//   if (!isModelFile) return;

//   event.respondWith(
//     caches.match(event.request).then((cached) => {
//       if (cached) {
//         console.log("Serving from cache:", event.request.url);
//         return cached;
//       }
//       return fetch(event.request).then((response) => {
//         return caches.open(CACHE_NAME).then((cache) => {
//           cache.put(event.request, response.clone());
//           return response;
//         });
//       });
//     })
//   );
// });