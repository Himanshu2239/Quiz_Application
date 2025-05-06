// Vercel Serverless Function Entry Point
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Server instance (will be cached between invocations)
let app = null;
let isSetup = false;

// Create and configure the Express application
async function setupApp() {
  if (isSetup) return app;
  
  try {
    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGO_DB;
    
    if (!mongoUri) {
      throw new Error('MONGO_DB environment variable not set');
    }
    
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      console.log('Connected to MongoDB Atlas');
    }
    
    // Create Express app
    app = express();
    
    // Basic middleware
    app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Setup session with MongoDB store
    const sessionStore = MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 // 1 day
    });
    
    app.use(session({
      secret: process.env.SESSION_SECRET || 'computer-science-assessment-secret',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      }
    }));
    
    // Import models and setup auth
    require('../dist/server/models');
    const auth = require('../dist/server/auth');
    auth.setupAuth(app);
    
    // Basic test route
    app.get('/api/status', (req, res) => {
      res.json({
        status: 'ok',
        mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    });
    
    // Setup API routes
    const routes = require('../dist/server/routes');
    await routes.registerRoutes(app);
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('API Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
    
    isSetup = true;
    return app;
  } catch (error) {
    console.error('Failed to setup Express app:', error);
    throw error;
  }
}

// Vercel serverless handler
module.exports = async (req, res) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Create/get the Express app
    const expressApp = await setupApp();
    
    // Handle the request with Express
    return expressApp(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};