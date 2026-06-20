import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "./auth";
import { JobApplication, JobStatus } from "../src/types";

const router = Router();

// In-Memory Database for Job Applications mapped to users
// Each application record holds an id, the field values, and the associated userId
interface DbJobApplication extends JobApplication {
  userId: string;
}

const dbApplications: Map<string, DbJobApplication> = new Map();

// Root seed data helper
const seedDefaultApplicationsForUser = (userId: string) => {
  const seedData: DbJobApplication[] = [
    {
      id: `app-seed-1-${userId}`,
      userId,
      company: "Google",
      role: "Senior Staff Engineer (Search Engine Team)",
      status: "offer",
      salary: "$240,000 + Stock Options",
      appliedDate: "2026-06-05",
      notes: "Completed all rounds of loop interviews. Reached out with draft sign-on terms. Final approvals pending."
    },
    {
      id: `app-seed-2-${userId}`,
      userId,
      company: "Stripe",
      role: "Lead Full-Stack Product Developer",
      status: "interviewing",
      salary: "$185,000",
      appliedDate: "2026-06-10",
      notes: "Finished the initial coding & core systems design steps. Scheduling next panels on Wednesday."
    },
    {
      id: `app-seed-3-${userId}`,
      userId,
      company: "OpenAI",
      role: "AI Application Specialist",
      status: "applied",
      salary: "Competitive Equity + Base",
      appliedDate: "2026-06-18",
      notes: "Applied online and submitted customized ATS resume with personalized summary block."
    }
  ];

  for (const app of seedData) {
    dbApplications.set(app.id, app);
  }
};

// Helper to validate application request data
const validateApplicationInput = (data: any): string | null => {
  if (!data.company || typeof data.company !== "string" || !data.company.trim()) {
    return "Company name is required and must be a valid string.";
  }
  if (!data.role || typeof data.role !== "string" || !data.role.trim()) {
    return "Job role is required and must be a valid string.";
  }
  const validStatuses: JobStatus[] = ["wishlist", "applied", "interviewing", "offer", "rejected"];
  if (!data.status || !validStatuses.includes(data.status)) {
    return `Status must be one of: ${validStatuses.join(", ")}`;
  }
  if (!data.appliedDate || typeof data.appliedDate !== "string" || !data.appliedDate.trim()) {
    return "Applied date is required.";
  }
  return null;
};

/**
 * 1. GET /api/applications
 * Retrieves all job applications belonging to the authenticated user.
 */
router.get("/", authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access: no authenticated user identified." });
      return;
    }

    // Check if user has any listings, return empty list if they are brand new
    const userApps = Array.from(dbApplications.values()).filter(app => app.userId === userId);

    // Fetch again
    const finalApps = userApps.map(({ userId: _, ...app }) => app); // strip userId structure for frontend consumption

    res.json(finalApps);
  } catch (error: any) {
    console.error("Error retrieving job applications:", error);
    res.status(500).json({ error: "Failed to load job applications from database securely." });
  }
});

/**
 * 2. POST /api/applications
 * Creates a brand new job application belonging exclusively to the authenticated user.
 */
router.post("/", authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    const validationError = validateApplicationInput(req.body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const { company, role, status, salary, jdUrl, jdText, appliedDate, notes } = req.body;

    const newAppId = `app-${Date.now()}`;
    const newApplication: DbJobApplication = {
      id: newAppId,
      userId,
      company: company.trim(),
      role: role.trim(),
      status,
      salary: salary ? salary.trim() : undefined,
      jdUrl: jdUrl ? jdUrl.trim() : undefined,
      jdText: jdText ? jdText.trim() : undefined,
      appliedDate,
      notes: notes ? notes.trim() : undefined
    };

    dbApplications.set(newAppId, newApplication);

    const { userId: _, ...responsePayload } = newApplication;
    res.status(201).json(responsePayload);
  } catch (error: any) {
    console.error("Error creating job application:", error);
    res.status(500).json({ error: "An unexpected error occurred while saving the application." });
  }
});

/**
 * 3. PUT /api/applications/:id
 * Updates an existing job application. Verifies owner security context beforehand.
 */
router.put("/:id", authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    const { id } = req.params;
    const existingApp = dbApplications.get(id);

    if (!existingApp) {
      res.status(404).json({ error: "Application card not found." });
      return;
    }

    // Access control: Ensure this user owns the application
    if (existingApp.userId !== userId) {
      res.status(403).json({ error: "Access denied: you do not own this application record." });
      return;
    }

    const validationError = validateApplicationInput(req.body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const { company, role, status, salary, jdUrl, jdText, appliedDate, notes } = req.body;

    const updatedApplication: DbJobApplication = {
      id,
      userId,
      company: company.trim(),
      role: role.trim(),
      status,
      salary: salary ? salary.trim() : undefined,
      jdUrl: jdUrl ? jdUrl.trim() : undefined,
      jdText: jdText ? jdText.trim() : undefined,
      appliedDate,
      notes: notes ? notes.trim() : undefined
    };

    dbApplications.set(id, updatedApplication);

    const { userId: _, ...responsePayload } = updatedApplication;
    res.json(responsePayload);
  } catch (error: any) {
    console.error("Error updating job application:", error);
    res.status(500).json({ error: "An unexpected error occurred while modifying the application." });
  }
});

/**
 * 4. PATCH /api/applications/:id/status
 * Quickly changes status stage of a specific application with authorization guard.
 */
router.patch("/:id/status", authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const existingApp = dbApplications.get(id);
    if (!existingApp) {
      res.status(404).json({ error: "Application card not found." });
      return;
    }

    if (existingApp.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const validStatuses: JobStatus[] = ["wishlist", "applied", "interviewing", "offer", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status stage provided." });
      return;
    }

    existingApp.status = status;
    dbApplications.set(id, existingApp);

    const { userId: _, ...responsePayload } = existingApp;
    res.json(responsePayload);
  } catch (error: any) {
    console.error("Error updating application status:", error);
    res.status(500).json({ error: "An error occurred while modifying the status." });
  }
});

/**
 * 5. DELETE /api/applications/:id
 * Deletes a job application after confirming owner security context.
 */
router.delete("/:id", authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    const { id } = req.params;
    const existingApp = dbApplications.get(id);

    if (!existingApp) {
      res.status(404).json({ error: "Application card not found or already deleted." });
      return;
    }

    if (existingApp.userId !== userId) {
      res.status(403).json({ error: "Access denied: you do not own this application record." });
      return;
    }

    dbApplications.delete(id);
    res.json({ success: true, message: "Application record deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting job application:", error);
    res.status(500).json({ error: "Failed to delete the application record securely." });
  }
});

export default router;
