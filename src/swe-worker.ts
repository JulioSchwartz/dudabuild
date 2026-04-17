/// <reference lib="webworker" />

// Handler de push notifications
self.addEventListener('push', (event: Event) => {
  const pushEvent = event as PushEvent
  if (!pushEvent.data) return

  let data: any = {}
  try { data = pushEvent.data.json() } catch(e) { data = { title: 'Zynplan', body: pushEvent.data.text() } }

  const options: NotificationOptions = {
    body:    data.body  || '',
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/icon-192x192.png',
    data:    { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
  }

  pushEvent.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(data.title || 'Zynplan', options)
  )
})

self.addEventListener('notificationclick', (event: Event) => {
  const notifEvent = event as NotificationEvent
  notifEvent.notification.close()
  const url = 'https://app.zynplan.com.br' + (notifEvent.notification.data?.url || '/dashboard')
  notifEvent.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list: readonly WindowClient[]) => {
        for (const c of list) {
          if (c.url.includes('zynplan') && 'focus' in c) {
            c.navigate(url)
            return c.focus()
          }
        }
        return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(url)
      })
  )
})