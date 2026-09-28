const CACHE_NAME = "shopify-support-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.webmanifest",
  "/shopify-bag.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Handle incoming Web Push notifications
self.addEventListener("push", (event) => {
  let data = { title: "Shopify Support", body: "You have a new support update." };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // fallback
  }

  const options = {
    body: data.body,
    icon: "/shopify-bag.svg",
    badge: "/shopify-bag.svg",
    data: {
      url: data.link || "/customer",
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || "/customer", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
