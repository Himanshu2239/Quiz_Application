# Computer Science Assessment Platform

A comprehensive computer science assessment platform offering advanced MCQ testing with robust features. Designed to provide an engaging and efficient learning experience for technical skill evaluation.

## Features

- 40 multiple-choice questions
- 2-hour timer that persists across sessions
- Progress saving for students
- Student management for administrators
- Result viewing for administrators
- Assessment restriction (24-hour cooldown)

## Technologies Used

- React.js frontend
- Express.js backend
- TypeScript implementation
- MongoDB Atlas integration
- Authentication with Passport.js

## Vercel Deployment Instructions

### Prerequisites
- A [Vercel](https://vercel.com) account
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) database

### Step 1: Fork or Clone the Repository
Clone this repository to your GitHub account.

### Step 2: Set Up MongoDB Atlas
1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster (the free tier is sufficient)
3. Create a database user with read/write permissions
4. Add your IP address to the IP allowlist (or use 0.0.0.0/0 for all IPs)
5. Get your connection string from Atlas

### Step 3: Deploy to Vercel
1. Log in to your Vercel account
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - Build Command: `./build-script.sh`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Add the following environment variables:
   - `MONGO_DB`: Your MongoDB Atlas connection string
   - `SESSION_SECRET`: A long, random string for session security

6. Click "Deploy"

### Step 4: Verify the Deployment
1. Once deployment is complete, click the provided URL
2. Log in with the default credentials:
   - Admin: username `admin`, password `admin123`
   - Student: username `2001086`, password `password`

## Local Development

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the following contents:
   ```
   MONGO_DB=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   ```
4. Run the development server with `npm run dev`
5. Access the application at http://localhost:5000

## Default Login Credentials

- **Admin**
  - Username: `admin`
  - Password: `admin123`
- **Student**
  - Username: `2001086`
  - Password: `password`