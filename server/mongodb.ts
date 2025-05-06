import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import { setupMongoDBCollections } from './mongodb-setup';

// Load environment variables
dotenv.config();

let mongoServer: MongoMemoryServer | null = null;
let isAtlasConnection = false;

// Connect to MongoDB - either real or in-memory
export async function connectToMongoDB() {
  try {
    // Check if we have a MongoDB connection string in environment variables
    const mongoUri = process.env.MONGO_DB;
    
    if (mongoUri) {
      try {
        // Connect to real MongoDB database with more options
        await mongoose.connect(mongoUri, {
          // These options help with connection reliability
          serverSelectionTimeoutMS: 5000, // Give up initial connection after 5 seconds
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
          family: 4 // Use IPv4, skip trying IPv6
        });
        
        isAtlasConnection = true;
        console.log('Connected to MongoDB Atlas successfully');
        
        // Set up collections and indexes for Atlas connection
        await setupMongoDBCollections();
      } catch (mongoError) {
        console.error('Failed to connect to MongoDB Atlas:', mongoError);
        console.log('Falling back to in-memory database');
        // Fallback to in-memory MongoDB server
        mongoServer = await MongoMemoryServer.create();
        const inMemoryUri = mongoServer.getUri();
        await mongoose.connect(inMemoryUri);
        console.log('Connected to MongoDB Memory Server successfully');
      }
    } else {
      // Use in-memory MongoDB server
      mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      await mongoose.connect(inMemoryUri);
      console.log('Connected to MongoDB Memory Server successfully');
    }
    
    // Initialize session store with the connected client
    const { storage } = await import('./storage');
    if ('initSessionStore' in storage) {
      storage.initSessionStore(mongoose.connection.getClient());
      console.log('MongoDB session store initialized successfully');
    }
    
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Disconnect from MongoDB
export async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Failed to disconnect from MongoDB:', error);
  }
}

export default mongoose;