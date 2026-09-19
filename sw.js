// Service worker — gère uniquement le cache des fichiers de l'interface
// (fonctionnement hors-ligne de l'app). La synchronisation des données
// passe entièrement par le SDK Firestore dans index.html, pas ici.

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

self.addEventListener("fetch", (event) => {
  // On ne gère que les requêtes GET du même site
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // En ligne : on va chercher la version fraîche et on la met en cache
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
        // Hors ligne : on sert la version en cache si elle existe
        const cached = await cache.match(event.request);
        if (cached) return cached;
        throw err;
      }
    })
  );
});
