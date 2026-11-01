import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestCodexNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const current = await LocalNotifications.checkPermissions();
    const result = current.display === 'granted' ? current : await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  }
  if (!('Notification' in window)) return false;
  const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  return result === 'granted';
}

export async function sendCodexCompletionNotification(body: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== 'granted') return;
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() % 2147483000),
        title: 'CodEX AI — response ready',
        body: body.slice(0, 140),
        schedule: { at: new Date(Date.now() + 350) },
        extra: { destination: 'console' },
        autoCancel: true
      }]
    });
    return;
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration?.showNotification) {
    await registration.showNotification('CodEX AI — response ready', {
      body: body.slice(0, 140),
      tag: 'codex-response-ready',
      data: { destination: 'console' }
    });
  } else {
    new Notification('CodEX AI — response ready', { body: body.slice(0, 140) });
  }
}

export async function addCodexNotificationTapListener(onOpenConsole: () => void): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  const listener = await LocalNotifications.addListener('localNotificationActionPerformed', () => onOpenConsole());
  return () => { void listener.remove(); };
}
