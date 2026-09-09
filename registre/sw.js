/* Cache hors ligne du Registre. La version change a chaque livraison :
   le telephone telecharge alors la nouvelle et jette l'ancienne, tout seul. */
const VERSION = "registre-20260909-0708";
const FICHIERS = ["./", "./index.html", "./icone-192.png", "./icone-512.png", "./manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((n) => Promise.all(n.filter((x) => x !== VERSION).map((x) => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
