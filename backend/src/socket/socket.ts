import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;
    console.log(`User connected: ${userId} (${socket.id})`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (${socket.id})`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
