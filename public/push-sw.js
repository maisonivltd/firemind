// Fire Mind - Push Notification Service Worker

self.addEventListener("push", (event) => {
  let data = { title: "Fire Mind", body: "Hai una nuova notifica" };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error("Error parsing push data:", e);
  }

  const options = {
    body: data.body,
    icon: data.icon || "/pwa-icon-192.png",
    badge: "/pwa-icon-192.png",
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [],
    tag: data.data?.type || "default",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data;
  let url = "/home";

  if (data?.type === "message" || data?.type === "broadcast") {
    url = "/messages";
  } else if (data?.type === "reminder") {
    url = "/notifications";
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
