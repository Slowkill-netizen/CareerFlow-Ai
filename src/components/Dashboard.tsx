import React from "react";
import { motion } from "motion/react";
import { 
  Briefcase,
  TrendingUp, 
  Cpu, 
  Award, 
  Sparkles, 
  ChevronRight,
  PlusCircle,
  FileText,
  UserCheck,
  Search
} from "lucide-react";

import { JobApplication } from "../types";

interface DashboardProps {
  applications: JobApplication[];
  resumeMatches: number[];
  interviewScores: number[];
  onNavigate: (tabId: string) => void;
  isPremium: boolean;
  onTogglePremium: () => void;
}

export default function Dashboard({
  applications,
  resumeMatches,
  interviewScores,
  onNavigate,
  isPremium,
  onTogglePremium
}: DashboardProps) {
  
  // Calculations
  const totalApps = applications.length;
  const interviewingApps = applications.filter(app => app.status === 'interviewing').length;
  const offersCount = applications.filter(app => app.status === 'offer').length;
  
  const interviewRate = totalApps > 0 ? Math.round(((interviewingApps + offersCount) / totalApps) * 100) : 0;
  
  const averageResumeMatch = resumeMatches.length > 0 
    ? Math.round(resumeMatches.reduce((a, b) => a + b, 0) / resumeMatches.length)
    : 72; // default standard placeholder before user Tailors

  const averageInterviewScore = interviewScores.length > 0
    ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
    : 80;

  // Recent apps list
  const recentApps = [...applications]
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* SaaS Premium Promo Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 p-6 text-white shadow-xl border border-slate-700/50"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles size={12} />
              SaaS Premium Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Elevate Your Career Trajectory with AI
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-xl">
              Track your hiring stages, tailoring resume points directly to ATS keywords, and rehearse with our dedicated mock interview tutor.
            </p>
          </div>
          <button
            onClick={onTogglePremium}
            className={`cursor-pointer whitespace-nowrap px-5 py-2.5 rounded-xl font-medium transition-all duration-200 border text-sm flex items-center gap-2 shadow-sm ${
              isPremium 
                ? "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 hover:scale-102"
                : "bg-white text-slate-900 border-gray-200 hover:bg-slate-50 hover:scale-102 hover:shadow"
            }`}
          >
            {isPremium ? (
              <>
                <span>★ Active Premium Tier</span>
              </>
            ) : (
              <>
                <Sparkles size={15} className="text-yellow-500" />
                <span>Go Premium Trial</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Handled</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalApps} Jobs</h3>
            <span className="text-[10px] text-blue-500 font-medium">Tracking boards</span>
          </div>
        </motion.div>

        {/* Conv rate/Interview rate card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Interview Rate</p>
            <h3 className="text-2xl font-bold text-slate-800">{interviewRate}%</h3>
            <span className="text-[10px] text-emerald-500 font-medium">{interviewingApps} active interview cycles</span>
          </div>
        </motion.div>

        {/* Average Match Score (via Resume Tailoring) */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4"
        >
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <Cpu size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg ATS Match</p>
            <h3 className="text-2xl font-bold text-slate-800">{averageResumeMatch}%</h3>
            <span className="text-[10px] text-violet-500 font-medium">Keywords optimized</span>
          </div>
        </motion.div>

        {/* Mock interview coaching average score */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Coach Score</p>
            <h3 className="text-2xl font-bold text-slate-800">{averageInterviewScore}/100</h3>
            <span className="text-[10px] text-amber-500 font-medium">Interactive response flow</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
          <h2 className="text-base font-bold text-slate-800">Quick Tools</h2>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate("jobs")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition text-left text-sm group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition">
                  <PlusCircle size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Add Job Cycle</h4>
                  <p className="text-xs text-slate-400">Track milestones & interviews</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => onNavigate("analyzer")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition text-left text-sm group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition">
                  <Search size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Analyze & Tailor Resume</h4>
                  <p className="text-xs text-slate-400">ATS match optimization & copyable bullets</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => onNavigate("interview")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition text-left text-sm group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">AI Mock Interview</h4>
                  <p className="text-xs text-slate-400">Constructive voice-friendly preparation</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

        {/* Dashboard Active Board Pipelines */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Job Pipeline Recents</h2>
            <button 
              onClick={() => onNavigate("jobs")}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Configure Board
            </button>
          </div>

          <div className="space-y-3">
            {recentApps.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <p>No active job cycles added yet.</p>
                <button
                  onClick={() => onNavigate("jobs")}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  Create your first card
                </button>
              </div>
            ) : (
              recentApps.map((app) => {
                const badgeColorMap: Record<string, { bg: string, text: string }> = {
                  wishlist: { bg: "bg-purple-50 border-purple-100", text: "text-purple-600" },
                  applied: { bg: "bg-blue-50 border-blue-100", text: "text-blue-600" },
                  interviewing: { bg: "bg-amber-50 border-amber-100", text: "text-amber-600" },
                  offer: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-600" },
                  rejected: { bg: "bg-rose-50 border-rose-100", text: "text-rose-600" },
                };
                const badge = badgeColorMap[app.status] || { bg: "bg-slate-50 border-slate-100", text: "text-slate-600" };

                return (
                  <motion.div
                    key={app.id}
                    layoutId={`dashboard-app-${app.id}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:shadow-xs transition gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{app.company}</span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-600 text-xs">{app.role}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>Applied on: {new Date(app.appliedDate).toLocaleDateString()}</span>
                        {app.salary && (
                          <>
                            <span>•</span>
                            <span>Est: {app.salary}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text}`}>
                      {app.status.toUpperCase()}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
