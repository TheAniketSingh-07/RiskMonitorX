// Socket.IO server setup for real-time notifications
import { Server } from 'socket.io';

let ioInstance = null;

export function initSocket(server) {
  if (ioInstance) return ioInstance;
  ioInstance = new Server(server, {
    cors: {
      origin: '*', // TODO: Restrict to your frontend domain in production, e.g. origin: 'https://your-frontend.com'
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket) => {
    // You can authenticate users here if needed
    // socket.handshake.query.token
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
    });
    // Add more event handlers as needed
  });

  return ioInstance;
}

export function sendUserNotification(userId, notification) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit('notification', notification);
}
