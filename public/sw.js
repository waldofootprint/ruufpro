// Service Worker for RuufPro push notifications.
// This runs in the background even when the app is closed.
// When a push event arrives, it shows a notification on the phone.

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "New Lead — RuufPro";
  const options = {
    body: data.body || "You have a new lead. Tap to view.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "ruufpro-lead",
    renotify: true,
    data: {
      url: data.url || "/dashboard/leads",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// When the user taps the notification, open the dashboard
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard/leads";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // If dashboard is already open, focus it
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(url);
    })
  );
});
