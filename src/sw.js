import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { clientsClaim } from "workbox-core";

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
const offlineNavigationHandler = createHandlerBoundToURL("/index.html");
registerRoute(new NavigationRoute(async ({ event }) => {
  try {
    return await fetch(event.request, { cache: "no-store" });
  } catch {
    return offlineNavigationHandler({ event });
  }
}));
// Supabase calls have no route, so they always go straight to the network.

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "Are you still working?", {
      body: data.body || "Your timer is still running.",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "timer-reminder",
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (all.length) {
      const target = all.find((c) => c.visibilityState === "visible") || all[0];
      await target.focus();
      target.postMessage({ type: "reminder" });
    } else {
      await self.clients.openWindow("/?reminder=1");
    }
  })());
});