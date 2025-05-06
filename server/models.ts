import mongoose, { Document, Schema } from 'mongoose';

// User interface
export interface IUser extends Document {
  username: string;
  password: string;
  role: string;
  email?: string;
  studentId?: string;
  registrationDate: Date;
}

// Question interface
export interface IQuestion extends Document {
  title: string;
  content: string;
  type: string;
  category: string;
  difficulty: string;
  options: string[];
  correctAnswer: string;
}

// Assessment interface
export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId | string;
  startTime: Date;
  endTime?: Date;
  timeRemaining?: number;
  isComplete: boolean;
  score?: number;
}

// Answer interface
export interface IAnswer extends Document {
  assessmentId: mongoose.Types.ObjectId | string;
  questionId: mongoose.Types.ObjectId | string;
  answer: string;
  isCorrect: boolean;
}

// User Schema
const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'student' },
  email: { type: String },
  studentId: { type: String, unique: true, sparse: true },
  registrationDate: { type: Date, default: Date.now }
});

// Question Schema
const QuestionSchema = new Schema<IQuestion>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, default: 'medium' },
  options: { type: [String] },
  correctAnswer: { type: String, required: true }
});

// Assessment Schema
const AssessmentSchema = new Schema<IAssessment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  timeRemaining: { type: Number },
  isComplete: { type: Boolean, default: false },
  score: { type: Number }
});

// Answer Schema
const AnswerSchema = new Schema<IAnswer>({
  assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  answer: { type: String },
  isCorrect: { type: Boolean }
});

// Create and export models
export const User = mongoose.model<IUser>('User', UserSchema);
export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
export const Answer = mongoose.model<IAnswer>('Answer', AnswerSchema);