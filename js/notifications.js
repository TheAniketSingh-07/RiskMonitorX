// Socket.IO client for real-time notifications
// Add this to your dashboard and other pages for live notification badge

let socket = null;

export function connectNotifications(userId) {
  if (socket) return;
  socket = io({
    // If backend is on a different host/port, specify full URL
    // path: '/socket.io',
    transports: ['websocket']
  });
  socket.emit('join', userId);
  socket.on('notification', (notif) => {
    // Show badge or notification popup
    showNotificationBadge();
    // Optionally, display notification content
    // alert(notif.message || 'New notification!');
  });
}

function showNotificationBadge() {
  const badge = document.querySelector('.header .badge-notification');
  if (badge) badge.style.display = 'inline-block';
  // Or add your own logic to update the UI
}

export function disconnectNotifications() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
