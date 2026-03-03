import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'http';

import connectDB from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import { initWhatsAppClient } from './whatsapp';
import authRoutes from './routes/authRoutes';
import guestRoutes from './routes/guestRoutes';
import rsvpRoutes from './routes/rsvpRoutes';
import statsRoutes from './routes/statsRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import messageRoutes from './routes/messageRoutes';
import tableRoutes from './routes/tableRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Required for correct IP/protocol detection behind Render.com's reverse proxy.
app.set('trust proxy', 1);

// 1. CORS MUST BE FIRST - Before helmet and rate limiting
app.use(cors({
  origin: ['http://localhost:3001', 'https://your-frontend-on-render.com'], // Add your Render URL here!
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'] 
}));
// 2. Security Headers - Adjusted for cross-origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 3. Global rate limiter - Skip OPTIONS requests to avoid preflight issues
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});
app.use(globalLimiter);

// 4. Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 5. Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 6. Routes
app.use('/api/admin', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/rsvp', rsvpRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/whatsapp', whatsappRoutes);   // GET /api/whatsapp/status
app.use('/api/messages', messageRoutes);    // POST /api/messages/send-invitation
app.use('/api/tables', tableRoutes);        // GET|POST /api/tables  PUT|DELETE /api/tables/:id  POST|DELETE /api/tables/:id/seat/:guestId

// 7. 404 & Error Handling
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use(errorHandler);

let server: http.Server;

const start = async () => {
  try {
    await connectDB();

    // whatsapp-web.js needs a local Chrome install and a physical device for
    // QR scanning — it cannot run on Render or other cloud hosts.
    // Enable locally by setting WHATSAPP_ENABLED=true in server/.env.
    if (process.env.WHATSAPP_ENABLED === 'true') {
      initWhatsAppClient();
    } else {
      console.log('[WhatsApp] Skipped — set WHATSAPP_ENABLED=true to enable locally.');
    }

    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

function shutdown() {
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

start();

export default app;
