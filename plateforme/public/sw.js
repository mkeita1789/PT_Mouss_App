/* PT Mouss IA — remplace le service worker de l'ancienne appli.
   L'ancienne version gardait des pages en cache sur les téléphones.
   Celui-ci vide ces caches, se désinstalle, puis recharge les onglets ouverts :
   le téléphone affiche alors la nouvelle appli, servie en direct.
   (Les données locales — historique, photos — ne sont PAS touchées.) */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cles = await caches.keys();
      await Promise.all(cles.map((c) => caches.delete(c)));
      await self.registration.unregister();
      const fenetres = await self.clients.matchAll({ type: "window" });
      fenetres.forEach((f) => f.navigate(f.url));
    })(),
  );
});
