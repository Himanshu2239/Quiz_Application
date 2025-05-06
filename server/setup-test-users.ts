import { User, Question } from './models';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import mongoose from 'mongoose';

const scryptAsync = promisify(scrypt);

// Hash function from our auth.ts
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function createTestUsers() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      console.log('Admin password hashed format:', { 
        hasPassword: !!hashedPassword,
        passwordLength: hashedPassword?.length,
        containsDot: hashedPassword?.includes('.')
      });
      
      const adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        email: 'admin@example.com',
        registrationDate: new Date()
      });
      await adminUser.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    // Check if student user already exists
    const existingStudent = await User.findOne({ username: '2001086' });
    if (!existingStudent) {
      // Create student user
      const hashedPassword = await hashPassword('password');
      console.log('Student password hashed format:', { 
        hasPassword: !!hashedPassword,
        passwordLength: hashedPassword?.length,
        containsDot: hashedPassword?.includes('.')
      });
      
      const studentUser = new User({
        username: '2001086',
        password: hashedPassword,
        role: 'student',
        email: 'student@example.com',
        studentId: '2001086',
        registrationDate: new Date()
      });
      await studentUser.save();
      console.log('Student user created successfully');
    } else {
      console.log('Student user already exists');
    }
    
    // Create sample questions if no questions exist
    const questionCount = await Question.countDocuments();
    if (questionCount === 0) {
      console.log('Creating sample questions...');
      await createSampleQuestions();
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up test users:', error);
    return false;
  }
}

async function createSampleQuestions() {
  const sampleQuestions = [
    {
      title: 'Variables',
      content: 'Which of the following is not a valid variable name in JavaScript?',
      type: 'multiple-choice',
      category: 'JavaScript',
      difficulty: 'easy',
      options: ['_myVar', '$price', '2numbers', 'firstName'],
      correctAnswer: '2numbers'
    },
    {
      title: 'Data Structures',
      content: 'Which data structure follows the LIFO (Last In First Out) principle?',
      type: 'multiple-choice',
      category: 'Data Structures',
      difficulty: 'medium',
      options: ['Queue', 'Stack', 'Linked List', 'Tree'],
      correctAnswer: 'Stack'
    },
    {
      title: 'Sorting Algorithms',
      content: 'What is the worst-case time complexity of Quicksort?',
      type: 'multiple-choice',
      category: 'Algorithms',
      difficulty: 'hard',
      options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
      correctAnswer: 'O(n²)'
    }
  ];

  try {
    await Question.insertMany(sampleQuestions);
    console.log(`Created ${sampleQuestions.length} sample questions`);
  } catch (error) {
    console.error('Error creating sample questions:', error);
  }
}