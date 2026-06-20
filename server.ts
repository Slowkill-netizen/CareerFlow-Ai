import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import multer from "multer";
import authRouter, { authenticateToken } from "./server/auth";
import applicationsRouter from "./server/jobApplications";
import interviewsRouter from "./server/interviews";
import { aiService } from "./server/aiService";
import { DocumentParser } from "./server/documentParser";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory storage for Multer file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB standard file limit
  }
});

// Main Auth endpoints
app.use("/api/auth", authRouter);

// Job Applications CRUD Endpoints
app.use("/api/applications", applicationsRouter);

// Stored Mock Interviews Endpoints
app.use("/api/interviews", interviewsRouter);

// Ensure the application remains healthy
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * 0. Resume Uploded File Text Extractor
 * Accepts .pdf and .docx, extracts text in memory, and returns result to client.
 */
app.post("/api/resume/parse", authenticateToken as any, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Missing uploaded file. Please select a resume file to upload." });
      return;
    }

    const { buffer, mimetype, originalname } = req.file;
    const text = await DocumentParser.parseFile(buffer, mimetype, originalname);

    res.json({
      success: true,
      filename: originalname,
      mimeType: mimetype,
      size: req.file.size,
      text: text
    });
  } catch (error: any) {
    console.error("Endpoint handling document parsing failure:", error);
    res.status(422).json({ 
      error: error.message || "An unexpected error occurred while parsing your file." 
    });
  }
});

/**
 * 1. Resume Tailor Engine
 * Evaluates Resume text against a target Job Description and yields structured guidance.
 */
app.post("/api/resume/tailor", authenticateToken as any, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
       res.status(400).json({ error: "Both current resume and target job description are required." });
       return;
    }

    console.log(`[Resume Tailor Audit] User ${userId} requested tailoring.`);
    const result = await aiService.tailorResume(resumeText, jobDescription);
    res.json(result);
  } catch (error: any) {
    console.error("Error tailoring resume:", error);
    res.status(500).json({ error: error.message || "Failed to process resume tailoring request." });
  }
});

/**
 * 1b. Resume Analyzer Endpoint
 * Conducts a thorough ATS analysis with match score, gaps, strength lists, and actionable career guidance.
 */
app.post("/api/resume/analyze", authenticateToken as any, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { resumeText, jobDescription, company, role } = req.body;
    if (!resumeText || !jobDescription) {
      res.status(400).json({ error: "Both current resume and target job description are required for ATS evaluation." });
      return;
    }

    console.log(`[Resume Analyze Audit] User ${userId} requested ATS analysis.`);
    const result = await aiService.analyzeResume({
      resumeText,
      jobDescription,
      company,
      role
    });
    res.json(result);
  } catch (error: any) {
    console.error("Error analyzing resume:", error);
    res.status(500).json({ error: error.message || "Failed to complete resume analysis." });
  }
});

/**
 * 2. Cover Letter Generator
 * Generates tailored cover letters with a choice of tone.
 */
app.post("/api/cover-letter/generate", authenticateToken as any, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { resumeText, jobDescription, company, role, tone } = req.body;
    if (!resumeText || !jobDescription || !company || !role) {
      res.status(400).json({ error: "Resume, Job Description, Company, and Role are all required." });
      return;
    }

    console.log(`[Cover Letter Audit] User ${userId} requested generator.`);
    const result = await aiService.generateCoverLetter({ resumeText, jobDescription, company, role, tone });
    res.json(result);
  } catch (error: any) {
    console.error("Error generating cover letter:", error);
    res.status(500).json({ error: error.message || "Failed to generate cover letter." });
  }
});

/**
 * 3. AI Interative Mock Interview Coach
 * Handles step-by-step roleplay interviews, responding with evaluation of current response and generating the next interview question.
 */
app.post("/api/interview/chat", authenticateToken as any, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { role, company, level, difficulty, interviewType, messages } = req.body;
    if (!role || !company || !messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Role, Company, and a history of Messages are required." });
      return;
    }

    console.log(`[Interview Coach Audit] User ${userId} posted dialogue turn.`);
    const result = await aiService.mockInterviewChat({ 
      role, 
      company, 
      level, 
      difficulty, 
      interviewType, 
      messages 
    });
    res.json(result);
  } catch (error: any) {
    console.error("Error in mock interview session:", error);
    res.status(500).json({ error: error.message || "Failed to process interview message." });
  }
});

// Configure Vite or Static Files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in Development Mode with Vite HMR...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in Production Mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareerFlow AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
