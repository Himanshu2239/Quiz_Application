import session from "express-session";
import { User, Question, Assessment, Answer, IUser, IQuestion, IAssessment, IAnswer } from "./models";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";

// Define types that match our Mongoose models but usable in the rest of the application
export type User = Omit<IUser, keyof mongoose.Document> & { id: string };
export type Question = Omit<IQuestion, keyof mongoose.Document> & { id: string };
export type Assessment = Omit<IAssessment, keyof mongoose.Document> & { id: string };
export type Answer = Omit<IAnswer, keyof mongoose.Document> & { id: string };

// For the insert types, we use simplified versions that don't include the id
export type InsertUser = Pick<User, "username" | "password" | "role" | "email" | "studentId">;
export type InsertQuestion = Pick<Question, "title" | "content" | "type" | "category" | "difficulty" | "options" | "correctAnswer">;
export type InsertAssessment = Pick<Assessment, "userId" | "startTime" | "timeRemaining">;
export type InsertAnswer = Pick<Answer, "assessmentId" | "questionId" | "answer" | "isCorrect">;

export interface IStorage {
  // User operations
  getUser(id: string | number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string | number): Promise<boolean>;
  getAllStudents(): Promise<User[]>;
  
  // Question operations
  getQuestion(id: string | number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string | number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string | number): Promise<boolean>;
  getAllQuestions(): Promise<Question[]>;
  getRandomQuestions(count: number): Promise<Question[]>;
  
  // Assessment operations
  getAssessment(id: string | number): Promise<Assessment | undefined>;
  getAssessmentsByUser(userId: string | number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string | number, data: Partial<Assessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: string | number): Promise<boolean>;
  getAllAssessments(): Promise<Assessment[]>;
  
  // Answer operations
  getAnswer(id: string | number): Promise<Answer | undefined>;
  getAnswersByAssessment(assessmentId: string | number): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: string | number, data: Partial<InsertAnswer>): Promise<Answer | undefined>;
  deleteAnswer(id: string | number): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.Store;
  
  // MongoDB specific - initialize session store with established client
  initSessionStore?(client: any): void;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private assessments: Map<number, Assessment>;
  private answers: Map<number, Answer>;
  
  private userId: number;
  private questionId: number;
  private assessmentId: number;
  private answerId: number;
  
  // Add session store
  public sessionStore: session.Store;
  
  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.assessments = new Map();
    this.answers = new Map();
    
    this.userId = 1;
    this.questionId = 1;
    this.assessmentId = 1;
    this.answerId = 1;
    
    // Initialize memory store for sessions
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      role: "admin",
      email: "admin@example.com"
    });

    // Initialize with sample CS questions
    this.createSampleQuestions();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.studentId === studentId);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const idNum = this.userId++;
    const id = idNum.toString(); // Convert to string for MongoDB compatibility
    const newUser: User = { ...user, id, registrationDate: new Date() };
    this.users.set(idNum, newUser);
    return newUser;
  }
  
  async deleteUser(id: string | number): Promise<boolean> {
    const idNum = typeof id === 'string' ? parseInt(id) : id;
    return this.users.delete(idNum);
  }
  
  async getAllStudents(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "student");
  }
  
  // Question operations
  async getQuestion(id: string | number): Promise<Question | undefined> {
    if (typeof id === 'string') {
      id = parseInt(id);
    }
    return this.questions.get(id);
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const idNum = this.questionId++;
    const id = idNum.toString(); // Convert to string for MongoDB compatibility
    const newQuestion: Question = { ...question, id };
    this.questions.set(idNum, newQuestion);
    return newQuestion;
  }
  
  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const existingQuestion = this.questions.get(id);
    if (!existingQuestion) return undefined;
    
    const updatedQuestion = { ...existingQuestion, ...question };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  async getAllQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }
  
  // Fisher-Yates algorithm for better randomization
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  // Randomize answer options while preserving correct answer
  private randomizeOptions(question: Question): Question {
    // For multiple-choice questions, randomize the options
    if (question.type === 'multiple-choice' && question.options) {
      // Keep track of the correct answer
      const correctAnswer = question.correctAnswer;
      
      // Shuffle the options
      const shuffledOptions = this.shuffleArray(question.options);
      
      // Return a new question with shuffled options
      return {
        ...question,
        options: shuffledOptions,
        // Original correctAnswer (e.g. "Option A") stays the same
        correctAnswer
      };
    }
    
    // For other question types or if no options, return as is
    return question;
  }

  async getRandomQuestions(count: number): Promise<Question[]> {
    const allQuestions = Array.from(this.questions.values());
    
    // First, randomize the order of questions
    const shuffledQuestions = this.shuffleArray(allQuestions);
    const selectedQuestions = shuffledQuestions.slice(0, Math.min(count, shuffledQuestions.length));
    
    // Then randomize options for each question
    return selectedQuestions.map(q => this.randomizeOptions(q));
  }
  
  // Assessment operations
  async getAssessment(id: string | number): Promise<Assessment | undefined> {
    if (typeof id === 'string') {
      id = parseInt(id);
    }
    return this.assessments.get(id);
  }
  
  async getAssessmentsByUser(userId: string | number): Promise<Assessment[]> {
    const userIdStr = typeof userId === 'number' ? userId.toString() : userId;
    return Array.from(this.assessments.values()).filter(assessment => 
      assessment.userId.toString() === userIdStr
    );
  }
  
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const idNum = this.assessmentId++;
    const id = idNum.toString(); // Convert to string for MongoDB compatibility
    const newAssessment: Assessment = { 
      ...assessment, 
      id, 
      isComplete: false,
      endTime: undefined,
      score: undefined
    };
    this.assessments.set(idNum, newAssessment);
    return newAssessment;
  }
  
  async updateAssessment(id: string | number, data: Partial<Assessment>): Promise<Assessment | undefined> {
    const idNum = typeof id === 'string' ? parseInt(id) : id;
    const existingAssessment = this.assessments.get(idNum);
    if (!existingAssessment) return undefined;
    
    const updatedAssessment = { ...existingAssessment, ...data };
    this.assessments.set(idNum, updatedAssessment);
    return updatedAssessment;
  }
  
  async getAllAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values());
  }
  
  async deleteAssessment(id: string | number): Promise<boolean> {
    const idNum = typeof id === 'string' ? parseInt(id) : id;
    return this.assessments.delete(idNum);
  }
  
  // Answer operations
  async getAnswer(id: string | number): Promise<Answer | undefined> {
    if (typeof id === 'string') {
      id = parseInt(id);
    }
    return this.answers.get(id);
  }
  
  async getAnswersByAssessment(assessmentId: string | number): Promise<Answer[]> {
    const assessmentIdStr = typeof assessmentId === 'number' ? assessmentId.toString() : assessmentId;
    return Array.from(this.answers.values()).filter(answer => 
      answer.assessmentId.toString() === assessmentIdStr
    );
  }
  
  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const idNum = this.answerId++;
    const id = idNum.toString(); // Convert to string for MongoDB compatibility
    const newAnswer: Answer = { ...answer, id };
    this.answers.set(idNum, newAnswer);
    return newAnswer;
  }
  
  async updateAnswer(id: string | number, data: Partial<InsertAnswer>): Promise<Answer | undefined> {
    const idNum = typeof id === 'string' ? parseInt(id) : id;
    const existingAnswer = this.answers.get(idNum);
    if (!existingAnswer) return undefined;
    
    const updatedAnswer = { ...existingAnswer, ...data };
    this.answers.set(idNum, updatedAnswer);
    return updatedAnswer;
  }
  
  async deleteAnswer(id: string | number): Promise<boolean> {
    const idNum = typeof id === 'string' ? parseInt(id) : id;
    return this.answers.delete(idNum);
  }

  // Create sample CS questions
  private async createSampleQuestions() {
    const sampleQuestions: InsertQuestion[] = [
      {
        title: "Binary Search Algorithm",
        content: "What is the time complexity of binary search algorithm?",
        type: "multiple-choice",
        category: "Algorithms",
        difficulty: "medium",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        correctAnswer: "O(log n)"
      },
      {
        title: "Stack Implementation",
        content: "Which data structure is typically used to implement a stack?",
        type: "multiple-choice",
        category: "Data Structures",
        difficulty: "medium",
        options: ["Array", "Linked List", "Both A and B", "None of the above"],
        correctAnswer: "Both A and B"
      },
      {
        title: "Time Complexity Analysis",
        content: "What is the time complexity of inserting an element into a sorted array?",
        type: "multiple-choice",
        category: "Algorithms",
        difficulty: "medium",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctAnswer: "O(n)"
      },
      {
        title: "Recursion Fundamentals",
        content: "What are the two base components of a recursive function?",
        type: "multiple-choice",
        category: "Programming",
        difficulty: "medium",
        options: ["Base case and recursive case", "Iterative part and recursive part", "Start condition and end condition", "Entry point and exit point"],
        correctAnswer: "Base case and recursive case"
      },
      {
        title: "Fibonacci Sequence Implementation",
        content: "Write a function to calculate the nth Fibonacci number using recursion.",
        type: "code",
        category: "Programming",
        difficulty: "medium",
        options: [],
        correctAnswer: "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}"
      }
    ];

    for (const question of sampleQuestions) {
      await this.createQuestion(question);
    }
  }
}

// MongoDB implementation of IStorage
export class MongoDBStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    // Set up a simple in-memory session store temporarily
    // We'll replace this with MongoDB store once connection is established
    this.sessionStore = new session.MemoryStore();
  }
  
  // Method to initialize MongoDB session store after connection is established
  public initSessionStore(client: any) {
    this.sessionStore = MongoStore.create({
      client: client,
      ttl: 14 * 24 * 60 * 60, // 14 days in seconds
      autoRemove: 'native'
    });
  }
  
  // Helper function to convert Mongoose document to plain object with id
  private documentToObject<T extends mongoose.Document>(doc: T | null): any {
    if (!doc) return undefined;
    const obj = doc.toObject();
    return { ...obj, id: obj._id.toString() };
  }
  
  // User operations
  async getUser(id: string | number): Promise<User | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid user ID format:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const user = await User.findById(idStr);
        return this.documentToObject(user);
      } else {
        // Log warning about non-ObjectId format
        console.warn(`Non-ObjectId format ID: ${idStr}, trying alternative lookup`);
        // Try to find by other means if possible
        return undefined;
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await User.findOne({ username });
      return this.documentToObject(user);
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }
  
  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    try {
      const user = await User.findOne({ studentId });
      return this.documentToObject(user);
    } catch (error) {
      console.error('Error getting user by student ID:', error);
      return undefined;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      const newUser = new User(user);
      await newUser.save();
      return this.documentToObject(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async deleteUser(id: string | number): Promise<boolean> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid user ID format:', id);
        return false;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const result = await User.deleteOne({ _id: idStr });
        return result.deletedCount > 0;
      } else {
        console.warn(`Non-ObjectId format ID for user: ${idStr}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  async getAllStudents(): Promise<User[]> {
    try {
      const students = await User.find({ role: 'student' });
      return students.map(student => this.documentToObject(student));
    } catch (error) {
      console.error('Error getting all students:', error);
      return [];
    }
  }
  
  // Question operations
  async getQuestion(id: string | number): Promise<Question | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid question ID format:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const question = await Question.findById(idStr);
        return this.documentToObject(question);
      } else {
        console.warn(`Non-ObjectId format ID for question: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error getting question:', error);
      return undefined;
    }
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    try {
      const newQuestion = new Question(question);
      await newQuestion.save();
      return this.documentToObject(newQuestion);
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }
  
  async updateQuestion(id: string | number, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid question ID format for update:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const updatedQuestion = await Question.findByIdAndUpdate(
          idStr,
          { $set: questionData },
          { new: true }
        );
        return this.documentToObject(updatedQuestion);
      } else {
        console.warn(`Non-ObjectId format ID for question update: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error updating question:', error);
      return undefined;
    }
  }
  
  async deleteQuestion(id: string | number): Promise<boolean> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid question ID format for delete:', id);
        return false;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const result = await Question.findByIdAndDelete(idStr);
        return !!result;
      } else {
        console.warn(`Non-ObjectId format ID for question delete: ${idStr}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  }
  
  async getAllQuestions(): Promise<Question[]> {
    try {
      const questions = await Question.find();
      return questions.map(question => this.documentToObject(question));
    } catch (error) {
      console.error('Error getting all questions:', error);
      return [];
    }
  }
  
  // Fisher-Yates algorithm for better randomization
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  // Randomize answer options while preserving correct answer
  private randomizeOptions(question: Question): Question {
    // For multiple-choice questions, randomize the options
    if (question.type === 'multiple-choice' && question.options) {
      // Keep track of the correct answer
      const correctAnswer = question.correctAnswer;
      
      // Shuffle the options
      const shuffledOptions = this.shuffleArray(question.options);
      
      // Return a new question with shuffled options
      return {
        ...question,
        options: shuffledOptions,
        correctAnswer
      };
    }
    
    // For other question types or if no options, return as is
    return question;
  }
  
  async getRandomQuestions(count: number): Promise<Question[]> {
    try {
      // For MongoDB we can use aggregation with $sample to get random questions
      const questions = await Question.aggregate([
        { $sample: { size: count } }
      ]);
      
      // Convert Mongoose documents to plain objects
      const plainQuestions = questions.map(q => ({ ...q, id: q._id.toString() }));
      
      // Then randomize options for each question
      return plainQuestions.map(q => this.randomizeOptions(q));
    } catch (error) {
      console.error('Error getting random questions:', error);
      return [];
    }
  }
  
  // Assessment operations
  async getAssessment(id: string | number): Promise<Assessment | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid assessment ID format:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const assessment = await Assessment.findById(idStr);
        return this.documentToObject(assessment);
      } else {
        console.warn(`Non-ObjectId format ID for assessment: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error getting assessment:', error);
      return undefined;
    }
  }
  
  async getAssessmentsByUser(userId: string | number): Promise<Assessment[]> {
    try {
      const userIdStr = typeof userId === 'number' ? String(userId) : userId;
      const assessments = await Assessment.find({ userId: userIdStr });
      return assessments.map(assessment => this.documentToObject(assessment));
    } catch (error) {
      console.error('Error getting assessments by user:', error);
      return [];
    }
  }
  
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    try {
      const newAssessment = new Assessment({
        ...assessment,
        isComplete: false
      });
      await newAssessment.save();
      return this.documentToObject(newAssessment);
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  }
  
  async updateAssessment(id: string | number, data: Partial<Assessment>): Promise<Assessment | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid assessment ID format for update:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const updatedAssessment = await Assessment.findByIdAndUpdate(
          idStr,
          { $set: data },
          { new: true }
        );
        return this.documentToObject(updatedAssessment);
      } else {
        console.warn(`Non-ObjectId format ID for assessment update: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error updating assessment:', error);
      return undefined;
    }
  }
  
  async getAllAssessments(): Promise<Assessment[]> {
    try {
      const assessments = await Assessment.find().populate('userId');
      return assessments.map(assessment => this.documentToObject(assessment));
    } catch (error) {
      console.error('Error getting all assessments:', error);
      return [];
    }
  }
  
  async deleteAssessment(id: string | number): Promise<boolean> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid assessment ID format for delete:', id);
        return false;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const result = await Assessment.findByIdAndDelete(idStr);
        return !!result;
      } else {
        console.warn(`Non-ObjectId format ID for assessment delete: ${idStr}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      return false;
    }
  }
  
  // Answer operations
  async getAnswer(id: string | number): Promise<Answer | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid answer ID format:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const answer = await Answer.findById(idStr);
        return this.documentToObject(answer);
      } else {
        console.warn(`Non-ObjectId format ID for answer: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error getting answer:', error);
      return undefined;
    }
  }
  
  async getAnswersByAssessment(assessmentId: string | number): Promise<Answer[]> {
    try {
      const assessmentIdStr = typeof assessmentId === 'number' ? String(assessmentId) : assessmentId;
      const answers = await Answer.find({ assessmentId: assessmentIdStr });
      return answers.map(answer => this.documentToObject(answer));
    } catch (error) {
      console.error('Error getting answers by assessment:', error);
      return [];
    }
  }
  
  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    try {
      const newAnswer = new Answer(answer);
      await newAnswer.save();
      return this.documentToObject(newAnswer);
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }
  
  async updateAnswer(id: string | number, data: Partial<InsertAnswer>): Promise<Answer | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid answer ID format for update:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const updatedAnswer = await Answer.findByIdAndUpdate(
          idStr,
          { $set: data },
          { new: true }
        );
        return this.documentToObject(updatedAnswer);
      } else {
        console.warn(`Non-ObjectId format ID for answer update: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error updating answer:', error);
      return undefined;
    }
  }
  
  async deleteAnswer(id: string | number): Promise<boolean> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid answer ID format for delete:', id);
        return false;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const result = await Answer.findByIdAndDelete(idStr);
        return !!result;
      } else {
        console.warn(`Non-ObjectId format ID for answer delete: ${idStr}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
      return false;
    }
  }
}

// Switch to MongoDB storage for persistence
export const storage = new MongoDBStorage();
