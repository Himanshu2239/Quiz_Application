import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SchemaUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      password: string;
      role: string;
      email?: string;
      studentId?: string;
      registrationDate: Date;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Handle the case where someone might have entered a plain text password during testing
    // IMPORTANT: This is only for development/testing to help with user experience
    // and should be removed in production
    if (supplied === stored) {
      console.log('Plain text password match! For testing only, should be removed in production.');
      return true;
    }
    
    // Make sure the stored password is in the correct format
    if (!stored || !stored.includes('.')) {
      console.error('Invalid password format:', stored);
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    
    // Validate both parts exist
    if (!hashed || !salt) {
      console.error('Invalid password parts:', { hashed: !!hashed, salt: !!salt });
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Make sure we have a session secret
  if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET not set in environment variables, using default');
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'computer-science-assessment-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`No user found with username: ${username}`);
          return done(null, false);
        }
        
        // Add debug info about the password format
        console.log(`User found: ${username}, Password format check:`, {
          hasPassword: !!user.password,
          passwordLength: user.password?.length,
          containsDot: user.password?.includes('.')
        });
        
        // Try to validate the password
        const isValid = await comparePasswords(password, user.password);
        
        if (!isValid) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error('Strategy error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      // With MongoDB, we use string IDs directly - no need to try to parse as integer
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password, role, email, studentId } = req.body;
      
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if student ID is already used
      if (studentId) {
        const existingStudentId = await storage.getUserByStudentId(studentId);
        if (existingStudentId) {
          return res.status(400).json({ message: "Student ID already exists" });
        }
      }

      // Create new user with hashed password
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        role: role || "student",
        email: email || undefined,
        studentId: studentId || undefined
      });

      // Login the user after registration (for students)
      if (role !== "admin") {
        req.login(user as unknown as Express.User, (err) => {
          if (err) return next(err);
          // Don't send the password back to the client
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      } else {
        // Don't automatically log in admin users
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      // Add better validation for login request
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
        if (err) {
          console.error('Authentication error:', err);
          return res.status(500).json({ message: "Authentication error", details: err.message });
        }
        
        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('Login error:', loginErr);
            return res.status(500).json({ message: "Login session error", details: loginErr.message });
          }
          
          // Don't send the password back to the client
          const { password, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      console.error('Unexpected login error:', error);
      return res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          return res.status(500).json({ message: "Failed to destroy session" });
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Don't send the password back to the client
    const { password, ...userWithoutPassword } = req.user as Express.User;
    res.json(userWithoutPassword);
  });
}