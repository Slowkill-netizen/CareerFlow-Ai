import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserCheck, 
  Sparkles, 
  MessageSquare, 
  Send, 
  Play, 
  Award, 
  AlertCircle, 
  ThumbsUp, 
  Cpu,
  Volume2,
  Trash2,
  HelpCircle,
  Clock,
  Calendar,
  ChevronRight,
  PlusCircle,
  Lightbulb,
  History,
  User,
  CheckCircle,
  XCircle,
  ChevronLeft
} from "lucide-react";
import { InterviewMessage, InterviewSession, SavedInterview } from "../types";

interface InterviewCoachProps {
  onAddInterviewScore: (score: number) => void;
  isPremium: boolean;
  onNavigateToPremium: () => void;
}

const LEVEL_OPTIONS = ["junior", "mid-level", "senior", "lead/manager"];
const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];

const INTERVIEW_TYPES = [
  { 
    id: "behavioral" as const, 
    name: "Behavioral & Leadership", 
    desc: "Evaluate ownership, resolving conflicts, and STAR (Situation, Task, Action, Result) answers summary", 
    color: "border-blue-100 bg-blue-50/50 text-blue-800 hover:bg-blue-50",
    badge: "bg-blue-100 text-blue-800"
  },
  { 
    id: "technical" as const, 
    name: "Technical & System Design", 
    desc: "Assess dynamic system design trade-offs, caching, databases, scaling & bottlenecks", 
    color: "border-teal-100 bg-teal-50/50 text-teal-850 hover:bg-teal-50",
    badge: "bg-teal-150 text-teal-800"
  },
  { 
    id: "coding" as const, 
    name: "Coding Concepts & Logic", 
    desc: "Evaluate algorithmic time complexity, space optimizations, and defensive data structures", 
    color: "border-amber-100 bg-amber-50/50 text-amber-800 hover:bg-amber-50",
    badge: "bg-amber-150 text-amber-850"
  },
  { 
    id: "product" as const, 
    name: "Product Sense & Analytical", 
    desc: "Solve user problem exploration, monetization, market strategy & metric dashboards", 
    color: "border-rose-100 bg-rose-50/50 text-rose-800 hover:bg-rose-50",
    badge: "bg-rose-150 text-rose-800"
  }
];

export default function InterviewCoach({
  onAddInterviewScore,
  isPremium,
  onNavigateToPremium
}: InterviewCoachProps) {
  // Navigation state
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  
  // Custom interview states
  const [session, setSession] = useState<InterviewSession>({
    role: "",
    company: "",
    level: "mid-level",
    difficulty: "medium",
    interviewType: "behavioral",
    messages: [],
    isStarted: false,
    isLoading: false,
    scoreHistory: []
  });

  const [inputAnswer, setInputAnswer] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // History state
  const [history, setHistory] = useState<SavedInterview[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SavedInterview | null>(null);

  // Load past simulations on start
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, session.isLoading]);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const token = localStorage.getItem("cf_token");
      const response = await fetch("/api/interviews", {
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Error drawing mock interview histories:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const applySampleSettings = (typeType: "behavioral" | "technical" | "coding" | "product") => {
    const presets = {
      behavioral: { role: "Product Designer", company: "Stripe", level: "senior", diff: "medium" },
      technical: { role: "Cloud SRE Specialist", company: "Netflix", level: "senior", diff: "hard" },
      coding: { role: "Fullstack Engineer", company: "Apple", level: "mid-level", diff: "medium" },
      product: { role: "Lead Product Manager", company: "Uber", level: "lead/manager", diff: "hard" }
    };

    const targetPreset = presets[typeType];
    setSession(prev => ({
      ...prev,
      role: targetPreset.role,
      company: targetPreset.company,
      level: targetPreset.level,
      difficulty: targetPreset.diff as any,
      interviewType: typeType
    }));
  };

  // Start interview session
  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.role.trim() || !session.company.trim()) {
      return;
    }

    setSession(prev => ({ ...prev, isStarted: true, isLoading: true, messages: [] }));

    try {
      const token = localStorage.getItem("cf_token");
      const response = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          role: session.role.trim(),
          company: session.company.trim(),
          level: session.level,
          difficulty: session.difficulty,
          interviewType: session.interviewType,
          messages: [] // empty for start
        })
      });

      if (!response.ok) {
        throw new Error("Failed to initialize interviewer session.");
      }

      const output = await response.json();
      
      const greetingMsg: InterviewMessage = {
        id: "greet-" + Date.now(),
        role: "model",
        text: output.nextQuestion,
        feedbackSummary: output.feedbackSummary || undefined,
        score: output.score || undefined,
        strengths: output.strengths || [],
        improvements: output.improvements || [],
        exampleAnswerPoints: output.exampleAnswerPoints || []
      };

      setSession(prev => ({
        ...prev,
        messages: [greetingMsg],
        currentQuestion: output.nextQuestion,
        isLoading: false
      }));
    } catch (err: any) {
      console.error(err);
      setSession(prev => ({
        ...prev,
        isStarted: false,
        isLoading: false
      }));
      alert("Error starting mock coach. Please check your network connection and API key configuration.");
    }
  };

  // Submit candidate answer
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || session.isLoading) return;

    const userText = inputAnswer.trim();
    setInputAnswer("");

    // Append user's answer immediately to the thread
    const userMsg: InterviewMessage = {
      id: "candidate-" + Date.now(),
      role: "user",
      text: userText
    };

    const updatedMessages = [...session.messages, userMsg];
    setSession(prev => ({
      ...prev,
      messages: updatedMessages,
      isLoading: true
    }));

    try {
      // Map simplified history for the model context
      const backendHistory = updatedMessages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const token = localStorage.getItem("cf_token");
      const response = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          role: session.role,
          company: session.company,
          level: session.level,
          difficulty: session.difficulty,
          interviewType: session.interviewType,
          messages: backendHistory
        })
      });

      if (!response.ok) {
        throw new Error("Interviewer connection interrupted.");
      }

      const data = await response.json();

      // Create model output message containing feedback, score & evaluation items + the next question
      const aiResponseMsg: InterviewMessage = {
        id: "interviewer-" + Date.now(),
        role: "model",
        text: data.nextQuestion,
        feedbackSummary: data.feedbackSummary,
        score: data.score,
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        exampleAnswerPoints: data.exampleAnswerPoints || []
      };

      const newScores = [...session.scoreHistory];
      if (data.score && data.score > 0) {
        newScores.push(data.score);
        // Call parent prop callback multiplied by 10 to keep it consistent with parent metrics
        onAddInterviewScore(data.score * 10);
      }

      setSession(prev => ({
        ...prev,
        messages: [...updatedMessages, aiResponseMsg],
        currentQuestion: data.nextQuestion,
        scoreHistory: newScores,
        isLoading: false
      }));
    } catch (err: any) {
      console.error(err);
      alert("Failed to evaluate message. Please establish API key settings.");
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Save full simulation to permanent DB history
  const handleSaveInterviewSession = async () => {
    if (session.messages.length <= 1) {
      alert("You need to complete at least one round of Q&A first before saving.");
      return;
    }

    const validScores = session.scoreHistory.filter(s => s > 0);
    const avgScore = validScores.length > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
      : 0;

    try {
      const token = localStorage.getItem("cf_token");
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          role: session.role,
          company: session.company,
          level: session.level,
          difficulty: session.difficulty,
          interviewType: session.interviewType,
          messages: session.messages,
          averageScore: avgScore
        })
      });

      if (response.ok) {
        alert("Awesome! Your mock interview has been saved successfully to the simulation history logs.");
        loadHistory();
        setActiveTab("history");
        handleReset();
      } else {
        throw new Error("Unable to contact backend save script.");
      }
    } catch (err) {
      console.error("Error saving mock simulation:", err);
      alert("Error saving session. Check backend logs.");
    }
  };

  const handleReset = () => {
    setSession({
      role: "",
      company: "",
      level: "mid-level",
      difficulty: "medium",
      interviewType: "behavioral",
      messages: [],
      isStarted: false,
      isLoading: false,
      scoreHistory: []
    });
    setInputAnswer("");
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this mock session from history?")) return;

    try {
      const token = localStorage.getItem("cf_token");
      const response = await fetch(`/api/interviews/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
        if (selectedHistoryItem?.id === id) {
          setSelectedHistoryItem(null);
        }
      } else {
        alert("Could not delete. Authenticate context expired.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const averageScore = session.scoreHistory.length > 0
    ? Math.round((session.scoreHistory.reduce((a, b) => a + b, 0) / session.scoreHistory.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      {/* Upper Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
        <div>
          <h1 className="text-xl font-bold font-sans text-slate-800 flex items-center gap-1.5">
            <Sparkles className="text-indigo-600" size={20} />
            AI Roleplay Interview Coach
          </h1>
          <p className="text-xs text-slate-500 font-sans">Simulate advanced, domain-specific interviewer dialogues and evaluate live responses.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab("new"); setSelectedHistoryItem(null); }}
            className={`cursor-pointer text-xs px-3.5 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition ${
              activeTab === "new"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                : "bg-white text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <PlusCircle size={14} />
            <span>New Simulation</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("history"); setSelectedHistoryItem(null); }}
            className={`cursor-pointer text-xs px-3.5 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition ${
              activeTab === "history"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                : "bg-white text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <History size={14} />
            <span>Simulation History ({history.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "history" ? (
        /* HISTORY TAB PANELS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* History selection menu list */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-150 p-4 space-y-3.5">
            <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider font-sans flex items-center gap-1">
              <Calendar size={13} className="text-slate-500" /> Saved Sessions Logs
            </h3>

            {isHistoryLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-sans animate-pulse">Loading previous sessions...</div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1.5">
                <p>No saved simulations found.</p>
                <button 
                  onClick={() => setActiveTab("new")}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  Configure and start your first session
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {history.map((record) => {
                  const isSelected = selectedHistoryItem?.id === record.id;
                  const intTypeObj = INTERVIEW_TYPES.find(t => t.id === record.interviewType);
                  return (
                    <div
                      key={record.id}
                      onClick={() => setSelectedHistoryItem(record)}
                      className={`cursor-pointer p-3.5 rounded-xl border text-left transition relative group ${
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white" 
                          : "bg-white border-slate-150 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <button
                        onClick={(e) => handleDeleteHistoryItem(record.id, e)}
                        title="Delete Session"
                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 p-1 bg-slate-50 rounded border border-slate-200"
                        style={{ color: isSelected ? '#ef4444' : undefined }}
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="space-y-1">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-indigo-900 text-indigo-100' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {record.difficulty.toUpperCase()} • {record.level.toUpperCase()}
                        </span>

                        <h4 className="font-bold text-[12px] pr-6 truncate mt-1">
                          {record.role}
                        </h4>
                        
                        <p className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          at {record.company}
                        </p>

                        <div className="flex items-center justify-between border-t border-slate-100/10 pt-2 mt-2">
                          <span className="text-[9px] font-mono opacity-80">
                            {new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className={`text-[11px] font-extrabold flex items-center gap-0.5 ${
                            isSelected ? "text-amber-400" : "text-indigo-600"
                          }`}>
                            Score: {record.averageScore}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transcript pane details on the right */}
          <div className="lg:col-span-8 bg-zinc-50/50 rounded-2xl border border-slate-150 p-6 min-h-[420px]">
            {selectedHistoryItem ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-4">
                  <div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 uppercase tracking-widest font-extrabold px-2 py-0.5 rounded font-sans">
                      {selectedHistoryItem.interviewType.toUpperCase()} SIMULATION DETAILS
                    </span>
                    <h2 className="text-base font-bold text-slate-800 mt-1 font-sans">
                      {selectedHistoryItem.role} Evaluation Transcript
                    </h2>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Conducted with the {selectedHistoryItem.company} AI agent on {new Date(selectedHistoryItem.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-3 text-right">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">AGGREGATE QUALITY</span>
                    <span className="text-xl font-extrabold text-amber-400">{selectedHistoryItem.averageScore} <span className="text-xs text-white opacity-60">/ 10</span></span>
                  </div>
                </div>

                {/* Timeline Messages container */}
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {selectedHistoryItem.messages.map((m, idx) => {
                    const isModel = m.role === 'model';
                    const previousTurnAnswerText = selectedHistoryItem.messages[idx - 1]?.text;

                    return (
                      <div key={m.id || idx} className="space-y-4">
                        <div className={`flex items-start gap-3 ${isModel ? "" : "flex-row-reverse"}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 select-none ${
                            isModel ? "bg-slate-800 text-white" : "bg-indigo-600 text-white"
                          }`}>
                            {isModel ? "AI" : "ME"}
                          </div>

                          <div className={`rounded-xl p-3.5 max-w-[85%] text-xs leading-relaxed border ${
                            isModel
                              ? "bg-white border-slate-200 text-slate-800 font-serif shadow-3xs"
                              : "bg-indigo-100 text-slate-800 border-indigo-200 font-sans shadow-3xs"
                          }`}>
                            <p className="whitespace-pre-wrap">{m.text}</p>
                          </div>
                        </div>

                        {/* If model turn had evaluation components */}
                        {isModel && m.score !== undefined && m.score > 0 && (
                          <div className="ml-10 p-5 rounded-xl bg-white border border-slate-200/80 space-y-3.5 shadow-sm text-xs">
                            <div className="flex items-center justify-between border-b pb-2">
                              <span className="font-bold text-indigo-800 flex items-center gap-1 font-sans">
                                <Sparkles size={13} className="text-indigo-600" />
                                AI Evaluation review (Answer: "{previousTurnAnswerText ? previousTurnAnswerText.slice(0, 45) + '...' : 'user response'}")
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 font-mono">
                                Evaluation Score: {m.score}/10
                              </span>
                            </div>

                            {m.feedbackSummary && (
                              <p className="text-slate-650 leading-relaxed font-sans bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                "{m.feedbackSummary}"
                              </p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                              {m.strengths && m.strengths.length > 0 && (
                                <div className="space-y-1">
                                  <span className="font-bold text-emerald-800 text-[10px] uppercase flex items-center gap-1"><ThumbsUp size={11} className="text-emerald-600" /> Key Strengths:</span>
                                  <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-600">
                                    {m.strengths.map((st, i) => <li key={i}>{st}</li>)}
                                  </ul>
                                </div>
                              )}

                              {m.improvements && m.improvements.length > 0 && (
                                <div className="space-y-1">
                                  <span className="font-bold text-amber-800 text-[10px] uppercase flex items-center gap-1"><AlertCircle size={11} className="text-amber-650" /> Improvement areas:</span>
                                  <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-600">
                                    {m.improvements.map((im, i) => <li key={i}>{im}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {m.exampleAnswerPoints && m.exampleAnswerPoints.length > 0 && (
                              <div className="border-t pt-3 font-sans">
                                <span className="font-bold text-indigo-800 text-[10px] uppercase flex items-center gap-1 mb-1"><Lightbulb size={11} className="text-indigo-600" /> Example parameters a strong answer could include:</span>
                                <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-600">
                                  {m.exampleAnswerPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                                </ul>
                              </div>
                            )}

                            <div className="text-[9px] text-slate-400 font-sans border-t pt-2 italic flex items-center gap-1">
                              <HelpCircle size={10} /> Alternate viewpoints or software configurations are highly valid and supported.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-24 space-y-2">
                <Award size={24} className="opacity-50" />
                <p>Select a simulation record in the left panel to explore full transcripts and detailed scores.</p>
              </div>
            )}
          </div>
        </div>
      ) : !session.isStarted ? (
        /* NEW INTERVIEW PROFILE SETUP form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-5 lg:col-span-5">
            <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b pb-2 font-sans flex items-center gap-1.5 text-indigo-600">
              <Cpu size={14} /> Configure Mock Interview
            </h3>

            <form onSubmit={handleStart} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Target Role *</label>
                <input
                  type="text"
                  required
                  value={session.role}
                  onChange={e => setSession({ ...session, role: e.target.value })}
                  placeholder="e.g. Senior Frontend Architect, Data Scientist"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Target Company *</label>
                <input
                  type="text"
                  required
                  value={session.company}
                  onChange={e => setSession({ ...session, company: e.target.value })}
                  placeholder="e.g. OpenAI, Spotify, Google"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Experience Level */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Experience Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_OPTIONS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSession({ ...session, level: lvl })}
                      className={`cursor-pointer capitalize py-2 rounded-xl text-center border text-[11px] transition ${
                        session.level === lvl
                          ? "border-indigo-500 bg-indigo-50/50 text-indigo-700 font-bold"
                          : "border-slate-150 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_OPTIONS.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSession({ ...session, difficulty: diff as any })}
                      className={`cursor-pointer capitalize py-2 rounded-xl text-center border text-[11px] transition ${
                        session.difficulty === diff
                          ? "border-indigo-500 bg-indigo-50/50 text-indigo-700 font-bold"
                          : "border-slate-150 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Modality Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Interview Modality Selection</label>
                <div className="flex flex-col gap-2">
                  {INTERVIEW_TYPES.map((type) => {
                    const isSelected = session.interviewType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSession({ ...session, interviewType: type.id })}
                        className={`cursor-pointer text-left p-3 rounded-xl border transition-all text-xs ${
                          isSelected 
                            ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-500" 
                            : "border-slate-150 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-bold block text-[11px] ${isSelected ? "text-indigo-800" : "text-slate-800"}`}>
                            {type.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-505 leading-normal mt-0.5">{type.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!session.role.trim() || !session.company.trim() || session.isLoading}
                className="cursor-pointer w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={13} fill="currentColor" />
                <span>Begin Real-Time Simulation</span>
              </button>
            </form>
          </div>

          {/* Right Presets & STAR guidelines */}
          <div className="lg:col-span-7 bg-slate-50/60 border border-slate-150 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider font-sans mb-1.5">Quick Setup Presets</h3>
              <p className="text-[10px] text-slate-500 mb-3.5">Select a category below to automatically configure realistic scenario target parameters:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INTERVIEW_TYPES.map((typeObj) => (
                  <button
                    key={typeObj.id}
                    onClick={() => applySampleSettings(typeObj.id)}
                    className="p-3 text-left bg-white border border-slate-150 hover:border-slate-300 rounded-xl transition cursor-pointer flex flex-col justify-between h-20"
                  >
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded w-max ${typeObj.badge}`}>
                      {typeObj.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 block mt-2">
                      Load {typeObj.id === 'coding' ? 'Algorithm' : typeObj.id === 'technical' ? 'SysDesign' : typeObj.id === 'product' ? 'Product' : 'STAR'} Setup
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-150" />

            {/* Guide box */}
            <div className="space-y-3.5">
              <h3 className="font-bold text-slate-850 text-xs font-sans uppercase tracking-tight flex items-center gap-1 text-slate-800">
                <CheckCircle size={14} className="text-emerald-500" /> High-Assessment Criteria
              </h3>
              <div className="space-y-2 text-xs text-slate-600 font-sans leading-relaxed">
                <p>
                  Our mock engine employs standard tech & behavioral scoring models. For premium scoring optimization, adhere to:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
                  <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                    <strong className="text-slate-800 block text-[11px]">System & Logic Optimization</strong>
                    <span className="text-slate-500 text-[10px] block leading-normal">Explain alternative system frameworks, state tradeoffs explicitly, and reference big-O computational space.</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                    <strong className="text-slate-800 block text-[11px]">Quantifiable STAR Results</strong>
                    <span className="text-slate-500 text-[10px] block leading-normal">Always structure with clear Situation, Task, Actions, and measurable numeric metrics (e.g., latency, users).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* IMMERSIVE LIVE INTERACTIVE CHAT SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Active Interviewer chat block */}
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xs flex flex-col h-[540px] lg:col-span-8 overflow-hidden">
            {/* Navigation Header info bar */}
            <div className="px-5 py-3.5 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-slate-600 font-sans font-bold uppercase tracking-wider">
                  MOCKING: <span className="text-indigo-600">{session.company}</span> • {session.level} {session.role} ({session.interviewType})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded tracking-wide">
                  {session.difficulty} / 10 Evaluation
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="cursor-pointer text-[10px] uppercase font-bold text-slate-400 hover:text-rose-500 border border-slate-150 px-2 py-0.5 rounded bg-white hover:bg-slate-50 flex items-center gap-0.5"
                >
                  Terminate
                </button>
              </div>
            </div>

            {/* Scrollable chat body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-zinc-50/40">
              {session.messages.map((msg, index) => {
                const isInterviewer = msg.role === 'model';
                const previousAnswerText = session.messages[index - 1]?.text;

                return (
                  <div key={msg.id || index} className="space-y-4">
                    <div className={`flex items-start gap-3 ${isInterviewer ? "" : "flex-row-reverse"}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                        isInterviewer 
                          ? "bg-slate-800 text-white" 
                          : "bg-indigo-600 text-white"
                      }`}>
                        {isInterviewer ? "AI" : "ME"}
                      </div>

                      {/* Msg bubble container */}
                      <div className={`rounded-2xl p-4 max-w-[80%] text-xs leading-relaxed border ${
                        isInterviewer
                          ? "bg-white border-slate-200 text-slate-800 shadow-3xs font-serif"
                          : "bg-indigo-600 text-white border-indigo-500"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>

                    {/* Rich Evaluation criteria block for current interviewer question */}
                    {isInterviewer && msg.score !== undefined && msg.score > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="ml-11 mr-4 p-5 rounded-2xl bg-white border border-slate-150 shadow-xs space-y-4 font-sans"
                      >
                        {/* Rating header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="text-amber-500" size={15} />
                            <div>
                              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Performance Summary</h4>
                              <p className="text-[10px] text-slate-400">STAR criteria & domain depth metrics</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">STABILITY</span>
                            <span className="text-xs font-black text-indigo-700">{msg.score}/10</span>
                          </div>
                        </div>

                        {/* General critique summary statement */}
                        {msg.feedbackSummary && (
                          <div className="text-[11px] text-slate-700 leading-normal italic bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            "{msg.feedbackSummary}"
                          </div>
                        )}

                        {/* Flex strengths/improvements arrays */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Strengths */}
                          {msg.strengths && msg.strengths.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-0.5 bg-emerald-50 w-max px-1.5 py-0.5 rounded">
                                <ThumbsUp size={10} /> Highlights & Strengths
                              </span>
                              <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-650 leading-normal">
                                {msg.strengths.map((str, i) => (
                                  <li key={i}>{str}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Gaps */}
                          {msg.improvements && msg.improvements.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-0.5 bg-amber-50 w-max px-1.5 py-0.5 rounded">
                                <AlertCircle size={10} /> Areas to Improve
                              </span>
                              <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-650 leading-normal">
                                {msg.improvements.map((imp, i) => (
                                  <li key={i}>{imp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Example points a strong answer could include */}
                        {msg.exampleAnswerPoints && msg.exampleAnswerPoints.length > 0 && (
                          <div className="border-t border-slate-100 pt-3 space-y-1.5">
                            <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1 bg-indigo-50 w-max px-2 py-0.5 rounded">
                              <Lightbulb size={11} className="text-indigo-600" /> Expected Strong Answer Points
                            </span>
                            <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-650 leading-normal">
                              {msg.exampleAnswerPoints.map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="text-[9px] text-slate-400 font-sans border-t pt-2 flex items-center gap-1 italic">
                          <HelpCircle size={10} />
                          Note: Alternate engineering strategies or behavioral styles are highly appreciated.
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}

              {session.isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-850 text-white flex items-center justify-center font-bold text-xs shrink-0 bg-slate-800">AI</div>
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs flex items-center gap-2">
                    <span className="flex space-x-1">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-[11px] text-slate-400 font-sans">Evaluating answer and generating next prompt...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Answer input container */}
            <form onSubmit={handleSubmitAnswer} className="p-4 border-t bg-white flex items-center gap-2.5">
              <textarea
                value={inputAnswer}
                onChange={e => setInputAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputAnswer.trim() && !session.isLoading) {
                      handleSubmitAnswer(e);
                    }
                  }
                }}
                placeholder="Formulate your response (Press Enter to submit, Shift+Enter for newline)..."
                rows={1}
                disabled={session.isLoading}
                className="flex-1 text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 disabled:bg-slate-50 resize-none max-h-16"
              />
              <button
                type="submit"
                disabled={!inputAnswer.trim() || session.isLoading}
                className="cursor-pointer p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-102 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send Answer"
              >
                <Send size={13} />
              </button>
            </form>
          </div>

          {/* Right Live statistics dashboard column */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-850 text-[11px] uppercase tracking-wider font-sans text-slate-800">
                Active Assessment metrics
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-slate-50 rounded-full border border-slate-150">
                  <span className="text-lg font-black text-slate-800">{averageScore || "--"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block">AVERAGE RATING</span>
                  <p className="text-xs text-slate-500 font-sans leading-tight">
                    {averageScore >= 8 
                      ? "Outstanding clarity & structured STAR alignment." 
                      : averageScore >= 6 
                      ? "Clean responses. Try mapping clearer data metrics." 
                      : averageScore > 0 
                      ? "Needs expansion. Detail your individual tasks openly."
                      : "Awaiting your first evaluated answer..."}
                  </p>
                </div>
              </div>

              {session.scoreHistory.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Progress Timeline</span>
                  <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-xl">
                    {session.scoreHistory.map((sc, i) => (
                      <div key={i} className="flex-1 bg-slate-200/60 rounded-md h-8 relative overflow-hidden group">
                        <div 
                          style={{ height: `${sc * 10}%` }} 
                          className={`absolute bottom-0 left-0 right-0 ${sc >= 8 ? 'bg-emerald-500' : sc >= 6 ? 'bg-amber-400' : 'bg-rose-400'}`} 
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-700">{sc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick action save state */}
            {session.messages.length > 1 && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2.5">
                <span className="text-[9px] bg-indigo-900 text-indigo-200 font-extrabold uppercase px-2 py-0.5 rounded tracking-widest">
                  SESSION CONCLUDING
                </span>
                <p className="text-xs text-slate-300 leading-normal">
                  Want to record this simulation? Close and submit this session to permanent logs.
                </p>
                <button
                  type="button"
                  onClick={handleSaveInterviewSession}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 transition font-bold text-xs text-white rounded-xl flex items-center justify-center gap-1 hover:scale-101 cursor-pointer"
                >
                  <History size={13} />
                  <span>Save Simulation to History</span>
                </button>
              </div>
            )}

            {/* Guide box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3 flex-1">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider font-sans flex items-center gap-1 text-indigo-600">
                <Cpu size={14} /> System Design STAR Guide
              </h3>
              <p className="text-[10.5px] text-slate-500 leading-normal">
                To maximize your rating score, structured answers should capture:
              </p>
              <div className="space-y-1.5 text-xs font-sans">
                <p className="p-2 bg-slate-50 rounded-lg text-slate-600"><strong className="text-slate-800">Situation</strong>: Frame the real-life bottleneck or conflict.</p>
                <p className="p-2 bg-slate-50 rounded-lg text-slate-650"><strong className="text-slate-800">Task</strong>: Your precise team allocation or ownership mandate.</p>
                <p className="p-2 bg-slate-50 rounded-lg text-slate-650"><strong className="text-slate-800">Action</strong>: Explicit algorithms, components, or systems built.</p>
                <p className="p-2 bg-slate-50 rounded-lg text-slate-650"><strong className="text-slate-800">Result</strong>: Percent improvements (latency, cost, throughput).</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
