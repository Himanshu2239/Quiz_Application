// MongoDB connection for Vercel serverless environment
const mongoose = require('mongoose');
require('dotenv').config();

// Cached connection
let cachedConnection = null;

async function connectToMongoDB() {
  // If we already have a connection, use it
  if (cachedConnection) {
    return cachedConnection;
  }

  // Get MongoDB URI from environment variables
  const mongoUri = process.env.MONGO_DB;
  
  if (!mongoUri) {
    throw new Error('MONGO_DB environment variable is not set');
  }
  
  try {
    // Connect to MongoDB Atlas
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('Connected to MongoDB Atlas successfully');
    
    // Cache the connection
    cachedConnection = connection;
    
    // Initialize session store with the connected client
    const { storage } = require('./storage');
    if ('initSessionStore' in storage) {
      storage.initSessionStore(mongoose.connection.getClient());
    }
    
    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Export the connection function
module.exports = { connectToMongoDB };