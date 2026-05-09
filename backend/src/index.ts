import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { sessionManager } from './services/whatsapp/SessionManager';
import { SeedService } from './services/utils/SeedService';
import whatsappRoutes from './routes/whatsappRoutes';
import './services/queue/MessageQueue'; // Initialize workers

// --- CRITICAL ERROR HANDLING (PREVENT CRASHES) ---
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
  if (err.message.includes('ENOENT') && err.message.includes('.zip')) {
    console.warn('⚠️ Ignoring RemoteAuth ZIP error to prevent process crash.');
    return;
  }
  // Log full error but keep process alive if it's a known non-critical issue
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('☄️ UNHANDLED REJECTION:', reason);
});
// -------------------------------------------------

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.DASHBOARD_URL || '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/klb-whatsapp';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/whatsapp', whatsappRoutes);

// Socket.io Setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join:org', (orgId) => {
    socket.join(orgId);
    console.log(`Socket ${socket.id} joined org ${orgId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize Session Manager with IO
sessionManager.setIo(io);

// Database Connection
mongoose.set('debug', true);
const mongooseOptions = {
  dbName: 'whatsapp-saas',
  autoIndex: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
};

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Seed initial flows
    await SeedService.seedKlbFlows();

    // Start active sessions in background
    console.log('Starting session initialization in background...');
    sessionManager.initAllSessions()
      .then(() => console.log('All sessions initialized in background.'))
      .catch(err => console.error('Error in background session initialization:', err));

    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log('=========================================');
      console.log(`🚀 KLB BACKEND RUNNING ON PORT: ${PORT}`);
      console.log(`📡 CORS ORIGIN: ${process.env.DASHBOARD_URL || '*'}`);
      console.log('=========================================');
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ PORT ${PORT} IS ALREADY IN USE. PLEASE KILL THE PROCESS.`);
        process.exit(1);
      } else {
        console.error('❌ SERVER ERROR:', err);
      }
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes Placeholder
app.get('/health', (req, res) => {
  res.json({ status: 'OK', sessions: 'Checking...' });
});

// Organization & Session Routes would go here
