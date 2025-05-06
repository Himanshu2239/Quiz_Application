// Single API entry point for Vercel serverless functions
const express = require('express');
const { connectToMongoDB } = require('../server/mongodb-vercel');
const { setupServer } = require('../server/vercel-setup');
const { createServer } = require('http');
require('dotenv').config();

// Initialize Express app and cache it
let cachedApp = null;

async function getApp() {
  if (cachedApp) {
    return cachedApp;
  }
  
  try {
    // Connect to MongoDB first
    await connectToMongoDB();
    
    // Now set up the Express server
    const app = express();
    const server = createServer(app);
    
    // Setup the Express server with all routes and middleware
    await setupServer(app, server);
    
    cachedApp = app;
    return app;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  }
}

// This is the serverless function handler
module.exports = async (req, res) => {
  try {
    const app = await getApp();
    
    // Use Express to handle the request
    return new Promise((resolve, reject) => {
      // This simulates what Express does internally
      res.on('close', resolve);
      res.on('error', reject);
      
      app(req, res);
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};