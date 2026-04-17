// Service Worker customizado — handler de push notifications
self.addEventListener('push', function(event) {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch (e) {
    data = {
      title: 'Zynplan',
      body:  event.data.text(),
    }
  }

  const options = {
    body:    data.body  || 'Nova notificação',
    icon:    data.icon  || '/icons/icon-192x192.png',
    badge:   data.badge || '/icons/icon-192x192.png',
    data:    { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Zynplan', options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Se já tem uma janela aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes('zynplan.com.br') && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Senão abre nova janela
      if (clients.openWindow) {
        return clients.openWindow('https://app.zynplan.com.br' + url)
      }
    })
  )
})