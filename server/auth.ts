import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const router = Router();

// Retrieve JWT secret safely with a resilient default
const JWT_SECRET = process.env.JWT_SECRET || "careerflow_ai_secret_phrase_2026";

// Extended interface for Express requests to attach authenticated user profile
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

// User Profile Model
export interface User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  joinedDate: string;
}

// In-Memory Database for CareerFlow AI Users (seeded with a trial user)
const usersDatabase: Map<string, User> = new Map();

// Reset Tokens structures
interface ResetToken {
  email: string;
  token: string;
  expiresAt: number;
}
const resetTokensDatabase: Map<string, ResetToken> = new Map();

// Simulation Outbox to allow previewing generated HTML emails
export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  resetUrl: string;
  token: string;
  createdAt: number;
}
const simulatedEmails: SimulatedEmail[] = [];

// Helper to validate email formatting
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 1. User Registration Endpoint
 * Validates inputs, checks for duplication, hashes password, and persists user record.
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;

    // Robust Input Validation
    if (!email || !password || !fullName) {
      res.status(400).json({ error: "All fields (email, password, fullName) are required." });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Please provide a valid email address." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters in length for security." });
      return;
    }

    // Uniqueness constraint check
    const normalizedEmail = email.toLowerCase().trim();
    const emailExists = Array.from(usersDatabase.values()).some(
      (user) => user.email === normalizedEmail
    );

    if (emailExists) {
      res.status(409).json({ error: "An account with this email address already exists." });
      return;
    }

    // Secure hashing of password with bcrypt (salt rounds = 10 for optimum security/performance balance)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create and save User profile
    const userId = "u-" + Date.now();
    const newUser: User = {
      id: userId,
      email: normalizedEmail,
      fullName: fullName.trim(),
      passwordHash,
      joinedDate: new Date().toISOString(),
    };

    usersDatabase.set(userId, newUser);

    // Generate JWT Access Token loaded with secure non-sensitive information
    const userPayload = { id: newUser.id, email: newUser.email, fullName: newUser.fullName };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "24h" });

    res.status(211).json({
      message: "Registration successful",
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "An unexpected error occurred during user registration." });
  }
});

/**
 * 2. User Login Endpoint
 * Validates credentials and returns JWT session token relative to authentic hash checks.
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required credentials." });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRecord = Array.from(usersDatabase.values()).find(
      (user) => user.email === normalizedEmail
    );

    if (!userRecord) {
      res.status(401).json({ error: "Invalid email or matching password." });
      return;
    }

    // Compare inputted password against stored password hash
    const match = await bcrypt.compare(password, userRecord.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Invalid email or matching password." });
      return;
    }

    // Generate JWT Access Token
    const userPayload = { id: userRecord.id, email: userRecord.email, fullName: userRecord.fullName };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: "Login successful",
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Error authenticating user:", error);
    res.status(500).json({ error: "An unexpected error occurred during user login." });
  }
});

/**
 * 2b. Forgot Password Recovery Link Request
 * Generates a verification token valid for 15 minutes, stores it,
 * and responds with a simulation sandbox URL for convenient preview.
 */
router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email address is required." });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Please enter a valid, standard email address." });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRecord = Array.from(usersDatabase.values()).find(
      (user) => user.email === normalizedEmail
    );

    // Minimize risk of email enumeration attacks by keeping similar message styles,
    // but in sandbox mode return explicit instructions or token links.
    if (!userRecord) {
      res.json({
        message: "If an account matching that email exists, an email has been sent with recovery instructions.",
        simulated: false
      });
      return;
    }

    // Generate token
    const token = "rst-" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes limit

    resetTokensDatabase.set(token, {
      email: normalizedEmail,
      token,
      expiresAt,
    });

    const host = req.get("host") || "localhost:3000";
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const resetUrl = `${protocol}/?resetToken=${token}`;

    console.log(`[PASSWORD RESET AUDIT] Recovery Link configured: ${resetUrl}`);

    // Generate Beautiful styled HTML email
    const emailHtml = `
<div style="font-family: 'Inter', -apple-system, system-ui, sans-serif; max-width: 550px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
  <div style="margin-bottom: 24px; display: inline-flex; align-items: center; gap: 8px;">
    <div style="background-color: #4f46e5; color: #ffffff; padding: 8px 12px; border-radius: 10px; font-weight: 800; font-size: 14px; line-height: 1; display: inline-block; text-align: center;">CF</div>
    <span style="font-weight: 800; font-size: 18px; color: #0f172a; margin-left: 8px; vertical-align: middle;">CareerFlow AI</span>
  </div>
  <p style="font-weight: 700; font-size: 15px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Password Recovery Request</p>
  <p style="font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 16px;">
    Hello <strong>${userRecord.fullName}</strong>,<br/>
    We received a request to reset the password linked to your CareerFlow AI workspace (${normalizedEmail}).
  </p>
  <div style="margin: 28px 0; text-align: center;">
    <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 700; display: inline-block;">Reset Password</a>
  </div>
  <p style="font-size: 11px; color: #64748b; line-height: 1.6; margin-bottom: 20px;">
    If you did not make this request, you can safely ignore this email. This recovery link is valid for 15 minutes.
  </p>
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 16px;" / >
  <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; margin: 0;">
    Copy URL directly:<br/>
    <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
  </p>
</div>`;

    // Attempt standard SMTP Delivery if variables are present
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `"CareerFlow AI" <noreply@careerflow.ai>`;
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

    let sentViaSMTP = false;
    let smtpError: string | null = null;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: normalizedEmail,
          subject: "CareerFlow AI - Reset Your Account Password",
          html: emailHtml,
        });

        sentViaSMTP = true;
        console.log(`[SMTP SUCCESS] Real password reset email sent successfully to ${normalizedEmail}`);
      } catch (err: any) {
        console.error("[SMTP ERROR] Real email delivery failed over SMTP:", err);
        smtpError = err.message || String(err);
      }
    }

    // Always queue to the in-memory outbox as secondary debug backup / sandbox assist
    simulatedEmails.push({
      id: "msg-" + Math.random().toString(36).substring(2, 9),
      to: normalizedEmail,
      subject: "CareerFlow AI - Reset Your Account Password",
      html: emailHtml,
      resetUrl,
      token,
      createdAt: Date.now()
    });

    if (simulatedEmails.length > 20) {
      simulatedEmails.shift();
    }

    if (sentViaSMTP) {
      res.json({
        message: `A password reset email has been successfully sent to ${normalizedEmail}. Please check your inbox.`,
        simulated: false,
        resetUrl,
        token,
      });
    } else {
      res.json({
        message: "An email structure has been dispatched. (Fallback to virtual sandbox preview window - to enable real emails, specify SMTP details in environmental secrets)",
        simulated: true,
        smtpError,
        resetUrl,
        token,
      });
    }
  } catch (error: any) {
    console.error("Error initiating forgot password request:", error);
    res.status(500).json({ error: "An unexpected error occurred during password recovery initialization." });
  }
});

/**
 * 2d. Get Simulated Outbox Feed (For Sandbox Testing)
 * Delivers generated emails currently in flight so users can click links or check email simulation.
 */
router.get("/outbox", (req: Request, res: Response) => {
  res.json(simulatedEmails.slice(-10).reverse()); // Send last 10 sorted newest first
});

/**
 * 2c. Reset Password Action
 * Accepts recovery token and replaces matching user password with a secure new hash.
 */
router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: "Token reference and desired secure password are both required." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Security standard: new password must be at least 6 characters." });
      return;
    }

    const tokenRecord = resetTokensDatabase.get(token);
    if (!tokenRecord) {
      res.status(400).json({ error: "Invalid, insecure, or expired password reset token." });
      return;
    }

    if (Date.now() > tokenRecord.expiresAt) {
      resetTokensDatabase.delete(token);
      res.status(400).json({ error: "Password reset link has expired. Please initiate another recovery search." });
      return;
    }

    const userRecord = Array.from(usersDatabase.values()).find(
      (user) => user.email === tokenRecord.email
    );

    if (!userRecord) {
      res.status(404).json({ error: "Assigned user account could no longer be found." });
      return;
    }

    // Hash and store
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    userRecord.passwordHash = passwordHash;
    usersDatabase.set(userRecord.id, userRecord);

    // Invalidation step
    resetTokensDatabase.delete(token);

    res.json({
      success: true,
      message: "Password reset complete. You can now authenticate."
    });
  } catch (error: any) {
    console.error("Error setting new password:", error);
    res.status(500).json({ error: "An unexpected error occurred during password update." });
  }
});

/**
 * 3. Token Verification Middleware
 * Extracts authentication details from bearer headers and populates request objects securely.
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expecting format 'Bearer <Token>'

  if (!token) {
    res.status(401).json({ error: "Access denied. Authentication token missing." });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: "Access denied. Token is invalid or has expired." });
      return;
    }

    req.user = decoded as { id: string; email: string; fullName: string };
    next();
  });
};

/**
 * 4. Fetch Authenticated Profile Details
 * Secure endpoint demonstrating JWT decryption and token verification.
 */
router.get("/me", authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
