import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle,
  Lightbulb, 
  Sparkles, 
  TrendingUp,
  AlertTriangle,
  Award,
  BookOpen,
  Users,
  Briefcase,
  Building,
  RotateCcw,
  PlusCircle,
  Copy,
  Info,
  Check,
  ChevronRight,
  FileText
} from "lucide-react";
import { ResumeAnalyzerResult } from "../types";
import ResumeUpload from "./ResumeUpload";

interface ResumeAnalyzerProps {
  onAddMatchScore: (score: number) => void;
  isPremium: boolean;
  onNavigateToPremium: () => void;
}

export default function ResumeAnalyzer({
  onAddMatchScore,
  isPremium,
  onNavigateToPremium
}: ResumeAnalyzerProps) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeAnalyzerResult | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null);

  const copyBulletToClipboard = (bullet: string, idx: number) => {
    navigator.clipboard.writeText(bullet);
    setCopiedBulletIdx(idx);
    setTimeout(() => setCopiedBulletIdx(null), 2000);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Please input both your resume and the target job description to run an ATS review.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem("cf_token");
      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ 
          resumeText, 
          jobDescription,
          company: company.trim() || undefined,
          role: role.trim() || undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data: ResumeAnalyzerResult = await response.json();
      setResult(data);
      if (data.match_score) {
        onAddMatchScore(data.match_score);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to complete AI Resume Analysis. Ensure your Gemini API is active.");
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    setCompany("Stripe");
    setRole("Product Software Engineer");
    setResumeText(
      `Jane Carter\nSOFTWARE ENGINEER\n\nEXPERIENCE:\n- Engineered responsive client-side user interfaces using standard React, HTML, and CSS.\n- Implemented in-memory state caching models in JavaScript to avoid unneeded API transactions.\n- Formulated unit integration test routines using Jest to assure front-end visual persistence.\n- Managed client database schemas in local SQLite structures.\n\nSKILLS:\nReact, Redux, JavaScript, TypeScript, Tailwind CSS, SQLite, Git, Jest.`
    );
    setJobDescription(
      `About Stripe & Role Requirements:\nWe are seeking a Product Software Engineer to refine our dashboard user flows and integrate payment flows.\n\nQualifications:\n- Highly experienced building complex, performant SPAs with React, TypeScript, and Tailwind CSS.\n- Strong expertise with backend Express servers and Cloud hosting PostgreSQL database structures.\n- Extensive understanding of state synchronization models and API optimization.\n- Familiarity with AWS Serverless configurations (Lambda, API Gateway) is highly desired.\n- Strong focus on accessibility, layout hierarchy, and professional performance testing.`
    );
  };

  const copyResultToClipboard = () => {
    if (!result) return;
    const reportText = `CAREERFLOW AI - ATS RESUME ANALYSIS REPORT
==========================================
Role: ${role || "Target Role"} | Company: ${company || "Target Company"}
Overall ATS Match Score: ${result.match_score}%

SUMMARY EVALUATION & REASONING:
${result.summary}

MATCHING SKILLS:
${result.matching_skills.map(s => `- ${s}`).join("\n")}

CONSTRUCTIVE GAPS:
${result.gaps.map(g => `- ${g}`).join("\n")}

MISSING REQUIREMENTS FROM JOB DESCRIPTION:
${result.missing_skills.map(m => `- ${m}`).join("\n")}

STRENGTHS DETECTED:
${result.strengths.map(s => `- ${s}`).join("\n")}

RECRUITER RECOMMENDATIONS:
${result.recommendations.map(r => `- ${r}`).join("\n")}

FORMATTING & EDITORIAL IMPROVEMENTS:
${result.resume_improvements.map(i => `- ${i}`).join("\n")}

TRUTHFUL & KEYWORD-ENHANCED RESUME BULLETS:
${result.tailored_bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1 px-1.5 text-xs bg-indigo-50 text-indigo-600 rounded font-black uppercase tracking-wider">AI Feature</span>
            Professional Resume Analyzer
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Submit your resume against a target job listing. Evaluates key discrepancies, verified skills vs unverified requirements, and assigns a realistic compatibility score.
          </p>
        </div>
        <button
          onClick={loadDemoData}
          className="cursor-pointer text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 self-start md:self-center"
        >
          <RotateCcw size={12} />
          Loadstripe Demo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Parameters Box */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleAnalyze} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-2.5">
              <Briefcase size={14} className="text-slate-500" />
              Target Position Details
            </h3>

            {/* Optional Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building size={11} className="text-slate-400" />
                  Target Company <span className="text-[9px] text-slate-400 font-medium">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe, Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-150 px-3 py-2 rounded-xl transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Briefcase size={11} className="text-slate-400" />
                  Target Role <span className="text-[9px] text-slate-400 font-medium">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-150 px-3 py-2 rounded-xl transition"
                />
              </div>
            </div>

            {/* Resume Upload Module */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                1. Upload Active Resume / CV
              </label>
              <ResumeUpload onTextExtracted={setResumeText} className="mt-1" />
            </div>

            {/* Editable Resume Text Box */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Resume Raw Content *</span>
                {resumeText && (
                  <span className="text-[9px] text-slate-400 font-medium lowercase">({resumeText.length} characters)</span>
                )}
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={5}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-150 px-3 py-2.5 rounded-xl font-mono transition resize-y"
                placeholder="Paste raw text here if you prefer to type out your credentials..."
              />
            </div>

            {/* Job Description Text Box */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                2. Target Job Description *
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-150 px-3 py-2.5 rounded-xl transition resize-y"
                placeholder="Copy and paste the exact qualifications, expectations, and role criteria from the job listing..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-150 rounded-xl flex items-start gap-2 text-[11px] text-red-700 font-medium">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`cursor-pointer w-full py-3 px-4 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-xs ${
                loading 
                  ? "bg-slate-400 cursor-wait" 
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-100"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing Honest Recruiter Review...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Execute AI ATS Deep Review</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Metrics Presentation */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-3xs flex flex-col items-center justify-center text-center space-y-4 min-h-[450px]">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Sparkles size={16} className="text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Reviewing Active Requirements overlap...</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
                  Our Career coach is parsing both texts, mapping technical frameworks, inspecting soft skills, and scoring match rate against real evidence.
                </p>
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-200" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-300" />
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Score & Expert Evaluation Rationale */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 flex flex-col items-center text-center py-2 md:border-r border-slate-100 pr-0 md:pr-6">
                  <div className="relative flex items-center justify-center">
                    {/* SVG Radial Gauge for suitability */}
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="9" fill="transparent" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        stroke={result.match_score >= 80 ? "#10b981" : result.match_score >= 60 ? "#f59e0b" : "#ef4444"} 
                        strokeWidth="9" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - result.match_score / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <span className="absolute text-2xl font-black text-slate-800">{result.match_score}%</span>
                  </div>
                  <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider mt-3">ATS VALID COMPATIBILITY</h4>
                  <span className={`mt-1.5 px-3 py-0.5 rounded-full text-[9px] font-extrabold ${
                    result.match_score >= 80 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                      : result.match_score >= 60 
                      ? "bg-amber-50 text-amber-700 border border-amber-100" 
                      : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}>
                    {result.match_score >= 80 ? "STRONG FIT" : result.match_score >= 60 ? "PARTIAL MATCH" : "CRITICAL SKILL GAPS"}
                  </span>
                </div>

                <div className="md:col-span-8 space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase font-sans">
                      Hiring Recruiter Evaluation
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                    {result.summary}
                  </p>
                </div>
              </div>

              {/* Verified Strengths and Constructive Gaps Side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3">
                  <h3 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600" />
                    Key Verified Strengths
                  </h3>
                  <p className="text-[10px] text-slate-400">Qualifications with verifiable presence mapping perfectly with requirements:</p>
                  <ul className="space-y-2">
                    {result.strengths.length === 0 ? (
                      <li className="text-xs text-slate-400 italic">No aligned strengths scanned. Customize experience points below.</li>
                    ) : (
                      result.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <Check size={11} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3">
                  <h3 className="font-bold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={14} className="text-amber-600" />
                    Constructive Gaps Detected
                  </h3>
                  <p className="text-[10px] text-slate-400">Qualifications not clearly proven in current resume copy:</p>
                  <ul className="space-y-2 flex-1">
                    {result.gaps.length === 0 ? (
                      <li className="text-xs text-slate-400 italic">Excellent match! No visible gaps compared to criteria.</li>
                    ) : (
                      result.gaps.map((g, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{g}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              {/* Overlapping Skills vs Lost Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Aligned Skills */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
                    <BookOpen size={14} className="text-indigo-650" />
                    Verified Matching Skills ({result.matching_skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matching_skills.length === 0 ? (
                      <span className="text-[10px] text-slate-450 italic text-slate-400">No overlapping tech skills parsed.</span>
                    ) : (
                      result.matching_skills.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-[9px] uppercase tracking-wide">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Missing Skills with recruiter rule */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                    <Info size={14} className="text-rose-500" />
                    Missing Required Skills ({result.missing_skills.length})
                  </h3>
                  
                  {/* Rule Banner */}
                  <div className="px-2.5 py-1.5 bg-rose-50 border border-rose-100 text-[9px] text-rose-800 font-bold rounded-xl leading-relaxed">
                    🚨 Never assume the candidate possesses a skill if it is not explicitly matching in their resume.
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_skills.length === 0 ? (
                      <span className="text-[10px] text-slate-450 italic text-slate-400">Perfect keyword matching found!</span>
                    ) : (
                      result.missing_skills.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-700 font-bold text-[9px] uppercase tracking-wide">
                          ✕ {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Actionable prioritized recommendations */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Lightbulb size={14} className="text-indigo-600" />
                  Prioritized Recruiter Recommendations
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Practical steps explaining why and how to enhance your candidate suitability based on job requirements:
                </p>
                <div className="space-y-2.5">
                  {result.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                      <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume Layout & Formatting Corrections */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={14} className="text-indigo-600 animate-pulse" />
                  Document Style, Phrasing & Formatting Suggestions
                </h3>
                <ul className="space-y-2.5 pl-1">
                  {result.resume_improvements.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed font-sans">
                      <ChevronRight size={13} className="text-indigo-500 shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Truthful & Keyword-Enhanced Resume Bullets (consolidated from tailor) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" />
                    Truthful & Keyword-Enhanced Resume Bullets
                  </h4>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">ATS Reformulated</span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  Opt to integrate these action-oriented rewrite suggestions to make your existing achievements truthfully pop. Click any bullet to copy:
                </p>

                <div className="space-y-3">
                  {result.tailored_bullets && result.tailored_bullets.length > 0 ? (
                    result.tailored_bullets.map((bullet, idx) => (
                      <div 
                        key={idx} 
                        className="group/bullet flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition cursor-pointer"
                        onClick={() => copyBulletToClipboard(bullet, idx)}
                      >
                        <div className="mt-0.5 min-w-4 text-indigo-600 font-bold text-xs">{idx + 1}.</div>
                        <p className="text-xs text-slate-700 flex-1 leading-relaxed font-sans">{bullet}</p>
                        <button 
                          className="text-slate-400 hover:text-slate-700 transition cursor-pointer opacity-40 group-hover/bullet:opacity-100 shrink-0 self-center"
                        >
                          {copiedBulletIdx === idx ? (
                            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 bg-emerald-55 px-2 py-0.5 rounded">
                              <Check size={11} className="stroke-[3]" />
                              Copied!
                            </span>
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No tailored experience enhancements generated.</p>
                  )}
                </div>

                <div className="pt-2 border-t text-center">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Swap or combine your original resume bullet definitions with these highly polished ATS alternatives.
                  </span>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  onClick={copyResultToClipboard}
                  className="cursor-pointer text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Copy size={13} />
                  {copiedReport ? "Report Copied to Clipboard!" : "Copy Full Analysis Report"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-3xs flex flex-col items-center justify-center text-center space-y-4 min-h-[450px]">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                ★
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-bold text-slate-800 text-sm">Awaiting Deep Analysis Executive Report</h3>
                <p className="text-xs text-slate-450 leading-relaxed text-slate-500">
                  Fill in the position metadata, paste your resume details (or drop a PDF/Word file) and insert the target job listings on the left, then trigger active calculation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
