// Serverless function for Vercel to handle all API requests
const express = require('express');
const { createServer } = require('http');
require('dotenv').config();

// Import MongoDB connection
const { connectToMongoDB } = require('../server/mongodb-vercel');

// Import the Express app setup
const { setupServer } = require('../server/vercel-setup');

// Initialize and cache the server
let cachedServer = null;

async function getServer() {
  if (cachedServer) {
    return cachedServer;
  }
  
  try {
    // Connect to MongoDB first
    await connectToMongoDB();
    
    // Now set up the Express server
    const app = express();
    const server = createServer(app);
    
    // Setup the Express server with all routes and middleware
    await setupServer(app, server);
    
    cachedServer = server;
    return server;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const server = await getServer();
    
    // Handle the request with the Express app
    await new Promise((resolve, reject) => {
      server._events.request(req, res);
      res.on('finish', resolve);
      res.on('error', reject);
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};