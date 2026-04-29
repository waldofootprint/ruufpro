// Service Worker for RuufPro push notifications.
// Runs in the background even when the app is closed.

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  if (data.type === "review_prompt") {
    const options = {
      body: data.body || "Tap to text a review request",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `ruufpro-review-${data.leadId || "x"}`,
      renotify: true,
      requireInteraction: true,
      actions: [
        { action: "send", title: "Send" },
        { action: "skip", title: "Skip" },
      ],
      data: {
        type: "review_prompt",
        leadId: data.leadId,
        smsHref: data.smsHref,
        url: data.url || `/review-prompt/${data.leadId}`,
      },
    };
    event.waitUntil(
      self.registration.showNotification(data.title || "Review request ready", options)
    );
    return;
  }

  // Default: new lead alert
  const title = data.title || "New Lead — RuufPro";
  const options = {
    body: data.body || "You have a new lead. Tap to view.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "ruufpro-lead",
    renotify: true,
    data: {
      url: data.url || "/dashboard",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  const d = event.notification.data || {};
  event.notification.close();

  // Review prompt — handle action buttons
  if (d.type === "review_prompt") {
    if (event.action === "send" && d.smsHref) {
      event.waitUntil(clients.openWindow(d.smsHref));
      return;
    }
    if (event.action === "skip" && d.leadId) {
      event.waitUntil(
        fetch("/api/reviews/skip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: d.leadId }),
          credentials: "include",
        }).catch(() => {})
      );
      return;
    }
    // Body tap → open the PWA card (handles iOS where actions may not render)
    event.waitUntil(clients.openWindow(d.url || `/review-prompt/${d.leadId}`));
    return;
  }

  // Default: focus dashboard if open
  const url = d.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
