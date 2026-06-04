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
// import './services/queue/MessageQueue'; // Disable Redis for now during Convex migration

// --- CRITICAL ERROR HANDLING (PREVENT CRASHES) ---
process.on('uncaughtException', (err: any) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
  if (err.code === 'ECONNRESET' || err.message.includes('ECONNRESET')) {
    console.warn('⚠️ Ignoring ECONNRESET socket error to prevent process crash.');
    return;
  }
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
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://klb-chat-boot.vercel.app',
        process.env.DASHBOARD_URL
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 4005;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/klb-whatsapp';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

import templateRoutes from './api/routes/template.routes';
import menuRoutes from './api/routes/menu.routes';
import ruleRoutes from './api/routes/rule.routes';
import scheduleRoutes from './api/routes/schedule.routes';
import messageRoutes from './api/routes/message.routes';
import analyticsRoutes from './api/routes/analytics.routes';

// Routes
app.get('/', (req, res) => {
  res.status(200).send('KLB Chat Boot Backend is Running 🚀');
});
app.use('/api/whatsapp', whatsappRoutes);

// V1 Platform APIs
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/menus', menuRoutes);
app.use('/api/v1/rules', ruleRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

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

// Initialize Session Manager
sessionManager.setIo(io);
sessionManager.initAllSessions();

// Database Connection
mongoose.set('debug', true);
const mongooseOptions = {
  dbName: 'whatsapp-saas',
  autoIndex: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
};

// Bypass MongoDB for now and start the server so the frontend doesn't get a connection error
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log('=========================================');
  console.log(`🚀 KLB BACKEND RUNNING ON PORT: ${PORT}`);
  console.log(`📡 CORS ORIGIN: ${process.env.DASHBOARD_URL || '*'}`);
  console.log('=========================================');
  console.log('⚠️ MongoDB is currently disabled for Convex migration.');
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ PORT ${PORT} IS ALREADY IN USE. PLEASE KILL THE PROCESS.`);
    process.exit(1);
  } else {
    console.error('❌ SERVER ERROR:', err);
  }
});

// Routes Placeholder
app.get('/health', (req, res) => {
  res.json({ status: 'OK', sessions: 'Checking...' });
});

// Organization & Session Routes would go here
