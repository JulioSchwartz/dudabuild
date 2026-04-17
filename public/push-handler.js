self.addEventListener('push', function(event) {
  if (!event.data) return
  var data = {}
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
  var url = 'https://app.zynplan.com.br' + (event.notification.data && event.notification.data.url ? event.notification.data.url : '/dashboard')
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf('zynplan') > -1 && 'focus' in list[i]) {
          list[i].navigate(url)
          return list[i].focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})