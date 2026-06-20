import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Languages, 
  Compass, 
  Zap, 
  SlidersHorizontal,
  Bookmark
} from "lucide-react";
import { CoverLetterResult } from "../types";
import ResumeUpload from "./ResumeUpload";

interface CoverLetterProps {
  isPremium: boolean;
  onNavigateToPremium: () => void;
}

const TONES = [
  { id: "professional", label: "Executive Modern", desc: "Sleek, polite, structured with strong confidence.", icon: "👔" },
  { id: "bold", label: "Bold & Disruptive", desc: "Passionate storyteller focusing on immediate impact.", icon: "🔥" },
  { id: "tech-savvy", label: "Structured Tech-Savvy", desc: "Engineered style pointing directly to metrics.", icon: "⚡" },
  { id: "empathetic", label: "Mission & Culture Driven", desc: "Warmly aligned with brand growth and shared goals.", icon: "🌱" }
];

export default function CoverLetterGenerator({
  isPremium,
  onNavigateToPremium
}: CoverLetterProps) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState("professional");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim() || !company.trim() || !role.trim()) {
      setError("Please input company details, targeted role, current resume, AND job description.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem("cf_token");
      const response = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ resumeText, jobDescription, company, role, tone })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setResult(data.coverLetter);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate Cover Letter. Have you added your Gemini API developer key?");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = () => {
    setCompany("Vercel");
    setRole("Product Architect");
    setResumeText(`John Doe\nFull-Stack Software Engineer\n\nExperience:\n- Built a web application in React and Node.js.\n- Managed a small Database system using MySQL.\n- Wrote unit tests and deployed to AWS cloud platform.\n- Fixed bugs and helped with code reviews.\n\nSkills: React, JavaScript, Node.js, HTML, CSS, SQL.`);
    setJobDescription(`Senior Product Architect\n\nWe are looking for a Senior Architect with outstanding TypeScript skills to design scalable and modular UI flows.\n\nRequired Qualifications:\n- Comprehensive experience with Vite, React, Tailwind CSS, Express, and modern Server-side architectures.\n- Experience optimizing legacy systems for peak performance.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">SaaS Cover Letter Generator</h1>
        <p className="text-xs text-slate-500">Draft personalized narratives addressing recruiter criteria and corporate values instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Details */}
        <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-tight">Job & Experience Details</h3>
            <button
              type="button"
              onClick={loadSample}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Fill Sample Text
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 font-sans">Target Company *</label>
              <input
                type="text"
                required
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. OpenAI"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 font-sans">Target Role *</label>
              <input
                type="text"
                required
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Frontend Architect"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Tone selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block font-sans">Choose Writing Persona</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTone(item.id)}
                  className={`cursor-pointer p-2.5 rounded-xl text-left border text-[11px] transition duration-200 ${
                    tone === item.id 
                      ? "border-indigo-500 bg-indigo-50/50 text-slate-900 font-bold" 
                      : "border-slate-100 hover:bg-slate-50 text-slate-600 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-sans">
                    <span role="img" aria-label="emotive">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <ResumeUpload onTextExtracted={setResumeText} className="my-2" />

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 font-sans">Your Raw Resume Text / Profile *</label>
            <textarea
              required
              rows={5}
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume highlights or profile..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 font-sans">Target Job Requirements *</label>
            <textarea
              required
              rows={5}
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the target JD parameters..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100/50 text-rose-700 text-xs">
              <span className="font-bold block font-sans">Generation Interrupted</span>
              <p className="mt-0.5 leading-relaxed font-sans">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-2 cursor-pointer ${
              loading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Drafting Letter...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Formulate Tailored Cover Letter</span>
              </>
            )}
          </button>
        </form>

        {/* Right Output Section */}
        <div className="lg:col-span-7">
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Zap size={18} className="text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm font-sans">Engineering Your Document Narrative</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto font-sans leading-relaxed">Infusing key skills dynamically with real context points.</p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <FileText size={22} />
              </div>
              <div>
                <h4 className="font-bold text-slate-700 text-sm font-sans font-semibold">Ready to Generate</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed font-sans">We will map highlights from your target career background to the specialized role profile, composing an original ready-for-print letter structure.</p>
              </div>
            </div>
          )}

          {!loading && result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-50 border border-slate-200/60 rounded-2xl shadow-sm p-6 sm:p-8 space-y-4"
            >
              {/* Output Actions Bar */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-tight font-bold font-sans">Draft Ready</span>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="font-sans">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span className="font-sans">Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>

              {/* Cover Letter Content Body */}
              <div className="prose max-w-none text-slate-800 text-xs leading-relaxed space-y-4 font-serif whitespace-pre-wrap select-text bg-white p-6 rounded-xl border shadow-2xs">
                {result}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400 font-sans">
                Review this document body thoroughly to inject custom greeting addresses before mailing.
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
