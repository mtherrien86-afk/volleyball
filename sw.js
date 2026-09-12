const CACHE_NAME = "bateliers-tri-cache-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Interception des requêtes pour gestion du cache (mise en cache des fichiers
// de l'app — HTML/CSS/JS — pour un fonctionnement hors-ligne de l'interface).
// Note : la synchronisation des DONNÉES (joueuses, évaluations) ne passe plus
// par ici, elle est gérée directement par le SDK Firestore dans index.html,
// qui a sa propre file d'attente hors-ligne intégrée.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        throw err;
      }
    })
  );
});
