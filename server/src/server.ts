import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'http';

import connectDB from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import guestRoutes from './routes/guestRoutes';
import rsvpRoutes from './routes/rsvpRoutes';
import statsRoutes from './routes/statsRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// --- CRITICAL FIX 1: Strict CORS & Preflight Response ---
app.use(cors({
  origin: 'https://wedding-rsvp-9d1c.onrender.com', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204 
}));

// --- CRITICAL FIX 2: Kill Trailing Slashes (Prevents Redirects) ---
app.use((req, res, next) => {
  if (req.path !== '/' && req.path.endsWith('/')) {
    const query = req.url.slice(req.path.length);
    const safepath = req.path.slice(0, -1);
    // Instead of res.redirect (which breaks CORS), we just fix it internally
    req.url = safepath + query;
  }
  next();
});

// Security & Limiter (Keep these AFTER CORS)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: (req) => req.method === 'OPTIONS', 
});
app.use(globalLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Routes
app.use('/api/admin', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/rsvp', rsvpRoutes);
app.use('/api/stats', statsRoutes);

app.get('/health', (_req, res) => res.status(200).send('OK'));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use(errorHandler);

let server: http.Server;
const start = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

start();