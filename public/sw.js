self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through — no caching
});

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "Panda Homes", body: event.data.text() };
  }

  const options = {
    body: payload.body || "",
    icon: "/android-chrome-192x192.png",
    badge: "/android-chrome-96x96.png",
    vibrate: [200, 100, 200],
    tag: payload.tag || "panda-notification",
    renotify: true,
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Panda Homes", options),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const urlToOpen = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // If the app is already open, focus it and navigate
        for (const client of clientList) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // Otherwise open a new window
        return clients.openWindow(urlToOpen);
      }),
  );
});
