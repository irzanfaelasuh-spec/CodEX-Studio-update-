self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => 'focus' in client);
    if (existing) {
      await existing.focus();
      existing.postMessage({ type: 'CODEX_OPEN_CONSOLE' });
      return;
    }
    await self.clients.openWindow('./?codex=console');
  })());
});
