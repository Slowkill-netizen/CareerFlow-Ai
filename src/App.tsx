import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Briefcase, 
  FileText, 
  UserCheck, 
  LayoutDashboard, 
  Sparkles,
  ClipboardList,
  Flame,
  Globe,
  Milestone,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Search
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import JobTracker from "./components/JobTracker";
import ResumeAnalyzer from "./components/ResumeAnalyzer";
import CoverLetterGenerator from "./components/CoverLetterGenerator";
import InterviewCoach from "./components/InterviewCoach";
import AuthScreen from "./components/AuthScreen";
import { JobApplication, JobStatus } from "./types";

const INITIAL_JOBS: JobApplication[] = [
  {
    id: "app-1",
    company: "Google",
    role: "Senior Software Architect",
    status: "wishlist",
    salary: "$180,000 - $220,000",
    appliedDate: "2026-06-15",
    notes: "Direct referral from alumni. Resume tailored using CareerFlow, matching 88% keywords."
  },
  {
    id: "app-2",
    company: "Stripe",
    role: "Full-Stack Engineer",
    status: "interviewing",
    salary: "$160,000 - $190,000",
    appliedDate: "2026-06-10",
    notes: "Completed initial phone screen. Technical take-home scheduled for Wednesday."
  },
  {
    id: "app-3",
    company: "OpenAI",
    role: "AI Application Developer",
    status: "applied",
    salary: "$210,000",
    appliedDate: "2026-06-18",
    notes: "Applied via careers portal. Uploaded bespoke executive-style cover letter draft."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [resumeMatches, setResumeMatches] = useState<number[]>([]);
  const [interviewScores, setInterviewScores] = useState<number[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);

  // Auth Session State
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; fullName: string } | null>(null);

  const [appsLoading, setAppsLoading] = useState<boolean>(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  // Initialize from LocalStorage scoped securely by user ID
  useEffect(() => {
    const savedToken = localStorage.getItem("cf_token");
    const savedUser = localStorage.getItem("cf_user");
    let userId = "";

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        userId = parsed.id;
      } catch (e) {
        console.error("Failed to parse saved user");
      }
    }

    if (userId) {
      // Load user-isolated assets only
      const savedApps = localStorage.getItem(`cf_${userId}_applications`);
      const savedMatches = localStorage.getItem(`cf_${userId}_matches`);
      const savedScores = localStorage.getItem(`cf_${userId}_scores`);
      const savedPremium = localStorage.getItem(`cf_${userId}_premium`);

      setApplications(savedApps ? JSON.parse(savedApps) : []);
      setResumeMatches(savedMatches ? JSON.parse(savedMatches) : []);
      setInterviewScores(savedScores ? JSON.parse(savedScores) : []);
      setIsPremium(savedPremium === "true");
    } else {
      // Pristine slate for unauthenticated guest
      setApplications([]);
      setResumeMatches([]);
      setInterviewScores([]);
      setIsPremium(false);
    }
  }, []);

  // Fetch from DB if user token exists
  useEffect(() => {
    if (!token || !currentUser) return;

    const fetchApplications = async () => {
      setAppsLoading(true);
      setAppsError(null);
      try {
        const response = await fetch("/api/applications", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error(`Server returned error status ${response.status}`);
        }
        const data = await response.json();
        setApplications(data);
        localStorage.setItem(`cf_${currentUser.id}_applications`, JSON.stringify(data));
      } catch (err: any) {
        console.error("Error fetching job applications from backend:", err);
        setAppsError(err.message || "Failed to load up-to-date applications.");
      } finally {
        setAppsLoading(false);
      }
    };

    fetchApplications();
  }, [token, currentUser]);

  // Sync state to user-isolated local storage wrapper
  const syncApplications = (newApps: JobApplication[]) => {
    setApplications(newApps);
    if (currentUser?.id) {
      localStorage.setItem(`cf_${currentUser.id}_applications`, JSON.stringify(newApps));
    }
  };

  // Add Job card
  const handleAddApplication = async (newApp: Omit<JobApplication, "id">) => {
    if (token) {
      setAppsLoading(true);
      try {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(newApp)
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to save application to server.");
        }
        const savedApp = await response.json();
        const updated = [savedApp, ...applications];
        syncApplications(updated);
      } catch (err: any) {
        console.error("Error creating job application:", err);
        alert(err.message || "Could not save your application to the backend.");
      } finally {
        setAppsLoading(false);
      }
    } else {
      const app: JobApplication = {
        ...newApp,
        id: "app-" + Date.now()
      };
      const updated = [app, ...applications];
      syncApplications(updated);
    }
  };

  // Update full Job Card (for Editing)
  const handleUpdateApplication = async (id: string, updatedFields: Partial<JobApplication>) => {
    const originalApp = applications.find(app => app.id === id);
    if (!originalApp) return;

    const consolidated = { ...originalApp, ...updatedFields };

    if (token) {
      setAppsLoading(true);
      try {
        const response = await fetch(`/api/applications/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(consolidated)
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update application on server.");
        }
        const savedApp = await response.json();
        const updated = applications.map(app => app.id === id ? savedApp : app);
        syncApplications(updated);
      } catch (err: any) {
        console.error("Error updating job application:", err);
        alert(err.message || "Failed to save edits to server.");
      } finally {
        setAppsLoading(false);
      }
    } else {
      const updated = applications.map(app => app.id === id ? consolidated : app);
      syncApplications(updated);
    }
  };

  // Update Status
  const handleUpdateStatus = async (id: string, status: JobStatus) => {
    // Optimistically update frontend
    const updated = applications.map(app => 
      app.id === id ? { ...app, status } : app
    );
    syncApplications(updated);

    if (token && currentUser) {
      try {
        const response = await fetch(`/api/applications/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });
        if (!response.ok) {
          throw new Error("Server failed to patch status");
        }
        const savedApp = await response.json();
        const synced = applications.map(app => app.id === id ? savedApp : app);
        syncApplications(synced);
      } catch (err) {
        console.error("Error patching status in database:", err);
      }
    }
  };

  // Delete card
  const handleDeleteApplication = async (id: string) => {
    // Optimistic delete from frontend
    const updated = applications.filter(app => app.id !== id);
    syncApplications(updated);

    if (token) {
      try {
        const response = await fetch(`/api/applications/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error("Server failed to delete application");
        }
      } catch (err) {
        console.error("Error communicating delete request to backend:", err);
      }
    }
  };

  // Save tailored match score to overall history
  const handleAddMatchScore = (score: number) => {
    const updated = [...resumeMatches, score];
    setResumeMatches(updated);
    if (currentUser?.id) {
      localStorage.setItem(`cf_${currentUser.id}_matches`, JSON.stringify(updated));
    }
  };

  // Save mock chat interview score
  const handleAddInterviewScore = (score: number) => {
    const updated = [...interviewScores, score];
    setInterviewScores(updated);
    if (currentUser?.id) {
      localStorage.setItem(`cf_${currentUser.id}_scores`, JSON.stringify(updated));
    }
  };

  // Premium Toggle
  const handleTogglePremium = () => {
    const val = !isPremium;
    setIsPremium(val);
    if (currentUser?.id) {
      localStorage.setItem(`cf_${currentUser.id}_premium`, String(val));
    }
    if (val) {
      setShowPremiumModal(true);
    }
  };

  const handleAuthSuccess = (newToken: string, user: { id: string; email: string; fullName: string }) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem("cf_token", newToken);
    localStorage.setItem("cf_user", JSON.stringify(user));

    // Load newly-signed-in user's isolated data pools immediately
    const userId = user.id;
    const savedApps = localStorage.getItem(`cf_${userId}_applications`);
    const savedMatches = localStorage.getItem(`cf_${userId}_matches`);
    const savedScores = localStorage.getItem(`cf_${userId}_scores`);
    const savedPremium = localStorage.getItem(`cf_${userId}_premium`);

    setApplications(savedApps ? JSON.parse(savedApps) : []);
    setResumeMatches(savedMatches ? JSON.parse(savedMatches) : []);
    setInterviewScores(savedScores ? JSON.parse(savedScores) : []);
    setIsPremium(savedPremium === "true");
  };

  const handleLogout = () => {
    // Clear fully isolated client-side React variables
    setToken(null);
    setCurrentUser(null);
    setApplications([]);
    setResumeMatches([]);
    setInterviewScores([]);
    setIsPremium(false);

    // Completely erase structural session headers
    localStorage.removeItem("cf_token");
    localStorage.removeItem("cf_user");

    // Clean session caches for hygiene
    sessionStorage.clear();
  };

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans">
      {/* SaaS Navigation / Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-4 ring-indigo-50">
                <Briefcase size={20} />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                  CareerFlow AI
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase">SaaS v1.0</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 font-sans">AI-Assisted Career Expansion</span>
              </div>
            </div>

            {/* Responsive Desktop Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-1.5 ${
                  activeTab === "dashboard" 
                    ? "bg-slate-950 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("jobs")}
                className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-1.5 ${
                  activeTab === "jobs" 
                    ? "bg-slate-950 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <ClipboardList size={14} />
                <span>Job Tracker</span>
              </button>

              <button
                onClick={() => setActiveTab("analyzer")}
                className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-1.5 ${
                  activeTab === "analyzer" 
                    ? "bg-slate-950 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Search size={14} />
                <span>Resume Analyzer</span>
              </button>

              <button
                onClick={() => setActiveTab("cover-letter")}
                className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-1.5 ${
                  activeTab === "cover-letter" 
                    ? "bg-slate-950 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Flame size={14} />
                <span>Cover Letter</span>
              </button>

              <button
                onClick={() => setActiveTab("interview")}
                className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-1.5 ${
                  activeTab === "interview" 
                    ? "bg-slate-950 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <UserCheck size={14} />
                <span>Interview Coach</span>
              </button>
            </nav>

            {/* Quick Profile / System bar */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleTogglePremium}
                className={`cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                  isPremium 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                }`}
              >
                {isPremium ? "★ Premium Trial" : "★ Go Premium"}
              </button>

              {currentUser && (
                <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase shadow-2xs">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="hidden lg:block text-left leading-none">
                      <p className="text-xs font-bold text-slate-800">{currentUser.fullName}</p>
                      <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{currentUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="cursor-pointer text-[10px] font-bold text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-100 px-2 py-1 rounded-md transition duration-150"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sub-Toolbar Tabs */}
      <div className="md:hidden bg-white border-b overflow-x-auto py-2 px-4 shadow-3xs flex items-center gap-1">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
            activeTab === "dashboard" ? "bg-slate-900 text-white" : "text-slate-600 bg-slate-50"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
            activeTab === "jobs" ? "bg-slate-900 text-white" : "text-slate-600 bg-slate-50"
          }`}
        >
          Jobs
        </button>
        <button
          onClick={() => setActiveTab("analyzer")}
          className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
            activeTab === "analyzer" ? "bg-slate-900 text-white" : "text-slate-600 bg-slate-50"
          }`}
        >
          Analyzer
        </button>
        <button
          onClick={() => setActiveTab("cover-letter")}
          className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
            activeTab === "cover-letter" ? "bg-slate-900 text-white" : "text-slate-600 bg-slate-50"
          }`}
        >
          Letter
        </button>
        <button
          onClick={() => setActiveTab("interview")}
          className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
            activeTab === "interview" ? "bg-slate-900 text-white" : "text-slate-600 bg-slate-50"
          }`}
        >
          Interview
        </button>
      </div>

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "dashboard" && (
              <Dashboard
                applications={applications}
                resumeMatches={resumeMatches}
                interviewScores={interviewScores}
                onNavigate={setActiveTab}
                isPremium={isPremium}
                onTogglePremium={handleTogglePremium}
              />
            )}

            {activeTab === "jobs" && (
              <JobTracker
                applications={applications}
                onAddApplication={handleAddApplication}
                onUpdateApplication={handleUpdateApplication}
                onUpdateStatus={handleUpdateStatus}
                onDeleteApplication={handleDeleteApplication}
                isLoading={appsLoading}
                error={appsError}
              />
            )}

            {activeTab === "analyzer" && (
              <ResumeAnalyzer
                onAddMatchScore={handleAddMatchScore}
                isPremium={isPremium}
                onNavigateToPremium={() => {
                  setIsPremium(true);
                  setShowPremiumModal(true);
                }}
              />
            )}

            {activeTab === "cover-letter" && (
              <CoverLetterGenerator
                isPremium={isPremium}
                onNavigateToPremium={() => {
                  setIsPremium(true);
                  setShowPremiumModal(true);
                }}
              />
            )}

            {activeTab === "interview" && (
              <InterviewCoach
                onAddInterviewScore={handleAddInterviewScore}
                isPremium={isPremium}
                onNavigateToPremium={() => {
                  setIsPremium(true);
                  setShowPremiumModal(true);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Premium Trial Welcome Dialog */}
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border text-center space-y-4"
            >
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-xl">
                ★
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg">Active Premium Tier Confirmed</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Thank you for trying out CareerFlow AI Premium. You now have complete, unrestricted access to the AI Mock Rehearsal Coach, ATS score optimization, and tone presets.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border">
                <div className="flex items-center gap-2 text-left justify-center text-[11px] text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>Unlimited Gemini AI Content Tailoring</span>
                </div>
                <div className="flex items-center gap-2 text-left justify-center text-[11px] text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>STAR Interview scoring and replay cycles</span>
                </div>
              </div>

              <button
                onClick={() => setShowPremiumModal(false)}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
              >
                Dismiss & Continue Explore
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Compact Footer */}
      <footer className="mt-auto border-t bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-[11px] text-slate-400 font-medium space-y-1">
          <p>© 2026 CareerFlow AI. All rights corporate structures reserved.</p>
          <p>Powered securely server-side by the Google Gemini AI Model & modern antialiased layout architectures.</p>
        </div>
      </footer>
    </div>
  );
}
