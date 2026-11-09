/* PT Mouss IA — service worker : notifications uniquement.
   Aucune page n'est mise en cache : l'appli est toujours servie en direct.
   Il remplace aussi l'ancien service worker de la PWA : s'il trouve des caches
   de l'ancienne appli, il les vide et recharge les onglets ouverts (une seule fois). */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cles = await caches.keys();
      await Promise.all(cles.map((c) => caches.delete(c)));
      await self.clients.claim();
      if (cles.length) {
        const fenetres = await self.clients.matchAll({ type: "window" });
        fenetres.forEach((f) => f.navigate(f.url));
      }
    })(),
  );
});

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
    d = { titre: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(d.titre || "PT Mouss IA", {
      body: d.corps || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: d.tag,
      renotify: !!d.tag,
      data: { url: d.url || "/" },
    }),
  );
});

/* Toucher la notification ouvre la bonne page (fiche de la cliente, accueil…) */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const f of fenetres) {
        if (new URL(f.url).origin === self.location.origin && "focus" in f) {
          await f.focus();
          if (f.url !== url && "navigate" in f) await f.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
