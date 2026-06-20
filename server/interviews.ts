import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "./auth";
import { SavedInterview } from "../src/types";

const router = Router();

// In-Memory Database for Saved Interviews mapped to users
interface DbSavedInterview extends SavedInterview {
  userId: string;
}

const dbInterviews: Map<string, DbSavedInterview> = new Map();

// Seed initial interview history example for demonstration purposes when completely empty
const seedDefaultInterviewsForUser = (userId: string) => {
  const seedId = `int-seed-1-${userId}`;
  dbInterviews.set(seedId, {
    id: seedId,
    userId,
    role: "Senior React Specialist",
    company: "Meta",
    level: "senior",
    difficulty: "medium",
    interviewType: "technical",
    messages: [
      {
        id: "m1",
        role: "model",
        text: "Welcome to your Mock Interview technical panel. Can you explain how React 18 Concurrent Mode and Suspense work under the hood?",
        score: 0
      },
      {
        id: "m2",
        role: "user",
        text: "Concurrent Mode allows React to interrupt ongoing rendering to handle high priority user inputs. Suspense lets components declare that they are waiting for some async resource before displaying, rendering fallbacks dynamically."
      },
      {
        id: "m3",
        role: "model",
        text: "Excellent explanation. That is very accurate.",
        score: 9,
        strengths: ["Clear differentiation of interactive rendering tasks", "Accurate definition of concurrent scheduling"],
        improvements: ["Mention the specific fiber architecture slicing mechanisms (Time Slicing)"],
        exampleAnswerPoints: ["React's Scheduler prioritizes task lanes (e.g. SyncLane, InputContinuousLane)", "Fibers act as incremental units of work", "useTransition hook is used to mark low priority states"],
        feedbackSummary: "A highly sophisticated answer that demonstrates deep architectural familiarity, though mentioning fiber time slicing would make it complete. Note that other structural designs are valid."
      }
    ],
    averageScore: 9,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  });
};

/**
 * 1. GET /api/interviews
 * Retrieves the authenticated user's past mock interview sessions.
 */
router.get("/", authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized user." });
      return;
    }

    // Fetch existing records for this user - brand new users start with a clean empty slate
    const userInterviews = Array.from(dbInterviews.values()).filter(i => i.userId === userId);

    // Return records without the internal userId field
    const sanitisedInterviews = userInterviews.map(({ userId: _, ...item }) => item);
    res.json(sanitisedInterviews);
  } catch (error: any) {
    console.error("Error fetching stored interviews history:", error);
    res.status(500).json({ error: "Failed to download stored mock history from server securely." });
  }
});

/**
 * 2. POST /api/interviews
 * Stores a completed mock interview session record.
 */
router.post("/", authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    const { role, company, level, difficulty, interviewType, messages, averageScore } = req.body;

    if (!role || !company || !messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Required fields (role, company, messages) are missing or invalid." });
      return;
    }

    const newId = `int-${Date.now()}`;
    const newRecord: DbSavedInterview = {
      id: newId,
      userId,
      role,
      company,
      level,
      difficulty: difficulty || "medium",
      interviewType: interviewType || "behavioral",
      messages,
      averageScore: averageScore || 0,
      createdAt: new Date().toISOString()
    };

    dbInterviews.set(newId, newRecord);

    const { userId: _, ...responsePayload } = newRecord;
    res.status(201).json(responsePayload);
  } catch (error: any) {
    console.error("Error saving completed interview session:", error);
    res.status(500).json({ error: "An unexpected error occurred while saving the interview session." });
  }
});

/**
 * 3. DELETE /api/interviews/:id
 * Deletes a saved interview session after confirming authorization bounds.
 */
router.delete("/:id", authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized context." });
      return;
    }

    const { id } = req.params;
    const record = dbInterviews.get(id);

    if (!record) {
      res.status(404).json({ error: "Saved interview session not found." });
      return;
    }

    if (record.userId !== userId) {
      res.status(403).json({ error: "Access denied: you do not own this session history record." });
      return;
    }

    dbInterviews.delete(id);
    res.json({ success: true, message: "Interview session history deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting interview history record:", error);
    res.status(500).json({ error: "Failed to delete from mock interview history database." });
  }
});

export default router;
