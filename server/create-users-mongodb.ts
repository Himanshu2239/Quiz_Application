import { User } from './models';
import { connectToMongoDB } from './mongodb';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Hash function from our auth.ts
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        password: await hashPassword('admin123'),
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
      const studentUser = new User({
        username: '2001086',
        password: await hashPassword('password'),
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
    
    // Create sample questions
    const questionCount = await User.countDocuments();
    if (questionCount === 0) {
      console.log('Creating sample questions...');
      // Add code to create sample questions if needed
    }
    
    console.log('Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up users:', error);
    process.exit(1);
  }
}

main();