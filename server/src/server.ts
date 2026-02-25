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

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.options('*', cors());
// --- STEP 3: Security & Parsing ---
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// --- STEP 4: Routes ---
app.use('/api/admin', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/rsvp', rsvpRoutes);
app.use('/api/stats', statsRoutes);

// Health check (Simple string to avoid JSON overhead)
app.get('/health', (_req, res) => res.status(200).send('ok'));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use(errorHandler);

// Server Start Logic
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