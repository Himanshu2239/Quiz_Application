import mongoose from 'mongoose';
import { User, Question, Assessment, Answer } from './models';

/**
 * Sets up the MongoDB database by creating necessary indexes and collections
 * This is called after successfully connecting to MongoDB Atlas
 */
export async function setupMongoDBCollections() {
  try {
    console.log('Setting up MongoDB collections and indexes...');
    
    // Create indexes for User collection
    await User.createIndexes();
    // Create unique indexes on username and studentId
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ studentId: 1 }, { unique: true, sparse: true });

    // Create indexes for Question collection
    await Question.createIndexes();
    // Index for category and difficulty to speed up random question selection
    await Question.collection.createIndex({ category: 1, difficulty: 1 });

    // Create indexes for Assessment collection
    await Assessment.createIndexes();
    // Index for userId to speed up finding a user's assessments
    await Assessment.collection.createIndex({ userId: 1 });
    
    // Create indexes for Answer collection
    await Answer.createIndexes();
    // Indexes for finding answers by assessment
    await Answer.collection.createIndex({ assessmentId: 1 });
    // Indexes for finding answers by question (for statistics)
    await Answer.collection.createIndex({ questionId: 1 });
    // Compound index for finding a specific answer to a question in an assessment
    await Answer.collection.createIndex({ assessmentId: 1, questionId: 1 }, { unique: true });
    
    console.log('MongoDB collections and indexes have been set up successfully');
  } catch (error) {
    console.error('Error setting up MongoDB collections:', error);
    // Don't throw error - we'll keep running even if index creation fails
  }
}

/**
 * Checks if we're connected to a real MongoDB Atlas instance (not in-memory)
 */
export function isMongoDBAtlas(): boolean {
  const uri = mongoose.connection.host;
  return uri.includes('mongodb.net') || uri.includes('mongodb+srv');
}