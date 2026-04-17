// Push notification handler
self.addEventListener('push', function(event) {
  if (!event.data) return

  let data = {}
  try { data = event.data.json() } catch(e) { data = { title: 'Zynplan', body: event.data.text() } }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Zynplan', {
      body:    data.body  || '',
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/icon-192x192.png',
      data:    { url: data.url || '/dashboard' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const url = 'https://app.zynplan.com.br' + (event.notification.data?.url || '/dashboard')
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('zynplan') && 'focus' in c) { c.navigate(url); return c.focus() }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})