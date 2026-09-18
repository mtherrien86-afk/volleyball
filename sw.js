const CACHE_NAME = "bateliers-tri-cache-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
@@ -17,7 +17,11 @@ self.addEventListener("activate", (event) => {
  self.clients.claim();
});

// Interception des requêtes pour gestion du cache




self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
@@ -37,48 +41,3 @@ self.addEventListener("fetch", (event) => {
    })
  );
});

// Synchronisation automatique en arrière-plan dès le retour de la connexion
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-joueuses-data") {
    event.waitUntil(syncDataOnline());
  }
});

async function syncDataOnline() {
  const db = await openDB();
  const tx = db.transaction("pending_data", "readonly");
  const store = tx.objectStore("pending_data");
  
  const records = await new Promise((res) => {
    store.getAll().onsuccess = (e) => res(e.target.result);
  });

  const API_ENDPOINT = "https://votre-api.com/enregistrer";

  for (const record of records) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record.payload)
      });

      if (response.ok) {
        // Supprimer l'élément envoyé avec succès de la base locale
        const delTx = db.transaction("pending_data", "readwrite");
        delTx.objectStore("pending_data").delete(record.id);
      }
    } catch (err) {
      console.error("Échec de synchronisation en arrière-plan :", err);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("BateliersDB", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
