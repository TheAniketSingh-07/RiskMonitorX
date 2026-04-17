import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import { errorHandler, notFound } from './src/middleware/errorMiddleware.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import riskRoutes from './src/routes/riskRoutes.js';
// ...existing code...
import logger from './src/utils/logger.js';

dotenv.config();

const app = express();

// Serve static frontend files (pages, css, js, etc.)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../')));

const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet());
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
//     return callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true
// }));

app.use(cors({
  origin: 'https://riskmonitorx.vercel.app/',
  credentials: true, // if you use cookies or authentication headers
}));

app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(API_PREFIX, apiLimiter);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/auth/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/risks`, riskRoutes);
// ...existing code...

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Running securely',
    apiPrefix: API_PREFIX
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
