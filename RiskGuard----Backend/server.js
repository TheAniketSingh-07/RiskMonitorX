import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/utils/socket.js';

dotenv.config();
await connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});

// Initialize Socket.IO
initSocket(server);

process.on('unhandledRejection', (error) => {
  console.error('[unhandled-rejection]', error);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  console.error('[uncaught-exception]', error);
  process.exit(1);
});
