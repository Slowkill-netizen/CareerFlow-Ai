import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Briefcase, 
  Loader2, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  Inbox, 
  Clock, 
  Send, 
  ExternalLink,
  X,
  RefreshCw
} from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: { id: string; email: string; fullName: string }) => void;
}

type AuthView = "login" | "register" | "forgot" | "reset";

interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  resetUrl: string;
  token: string;
  createdAt: number;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>("login");

  // Form values
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");

  // UI state managers
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Simulation outbox hooks
  const [outbox, setOutbox] = useState<SimulatedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);
  const [lastPolledAt, setLastPolledAt] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Detect token parameter in URL path on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("resetToken");
      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
        setView("reset");
        setSuccessMessage("Secure reset token detected from link. Please choose a new password.");
      }
    } catch (e) {
      console.error("Could not parse query parameters:", e);
    }
  }, []);

  // Poll simulated email outbox to present real-time dispatching
  const fetchOutbox = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/auth/outbox");
      if (res.ok) {
        const data = await res.json();
        setOutbox(data);
      }
      setLastPolledAt(new Date());
    } catch (e) {
      console.error("Failed to load simulated outbox queue:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOutbox();
    const handle = setInterval(fetchOutbox, 3500);
    return () => clearInterval(handle);
  }, []);

  // Helper to validate input before triggers
  const validateForm = (): boolean => {
    setErrorMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (view === "login" || view === "register" || view === "forgot") {
      if (!email.trim()) {
        setErrorMessage("Please input your email address.");
        return false;
      }
      if (!emailRegex.test(email.trim())) {
        setErrorMessage("Please enter a valid, standard email address.");
        return false;
      }
    }

    if (view === "login" || view === "register") {
      if (!password) {
        setErrorMessage("Please type your secure password.");
        return false;
      }
      if (password.length < 6) {
        setErrorMessage("Security standard: password must be at least 6 characters.");
        return false;
      }
    }

    if (view === "register" && !fullName.trim()) {
      setErrorMessage("Please provide your full name for professional branding.");
      return false;
    }

    if (view === "reset") {
      if (!resetToken.trim()) {
        setErrorMessage("A password reset token is required.");
        return false;
      }
      if (!password) {
        setErrorMessage("Please type a new secure password.");
        return false;
      }
      if (password.length < 6) {
        setErrorMessage("Security standard: new password must be at least 6 characters.");
        return false;
      }
    }

    return true;
  };

  // Perform Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (view === "login" || view === "register") {
        const payload = view === "login" 
          ? { email: email.trim(), password }
          : { email: email.trim(), password, fullName: fullName.trim() };

        const endpoint = view === "login" ? "/api/auth/login" : "/api/auth/register";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Authentication failed. Please verify credentials.");
        }

        setSuccessMessage(view === "login" ? "Welcome back! Porting workspace..." : "Account created successfully! Loading dashboard...");
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 800);

      } else if (view === "forgot") {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to process password recovery request.");
        }

        setSuccessMessage(data.message);
        // Instantly force a list update
        fetchOutbox();

      } else if (view === "reset") {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken.trim(), password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Password reset failed. Token may be invalid or expired.");
        }

        setSuccessMessage("Success! Your password was updated. Redirecting to sign in...");
        setPassword("");
        setResetToken("");
        setSelectedEmail(null);

        // Clear query parameters from address bar to keep things pristine
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {}

        setTimeout(() => {
          setView("login");
          setSuccessMessage(null);
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred with authentication servers.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToForgot = () => {
    setView("forgot");
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword("");
  };

  const applySimulatedReset = (emailObj: SimulatedEmail) => {
    setResetToken(emailObj.token);
    setView("reset");
    setSelectedEmail(null);
    setSuccessMessage(`Simulated token loaded automatically for ${emailObj.to}! Enter your new desired secure password below.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background flares */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-200/40 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full filter blur-3xl translate-x-1/3 translate-y-1/3 -z-10" />

      {/* Main Container Wrapper - Responsive Layout Grid Split */}
      <div className="mx-auto w-full max-w-md lg:max-w-5xl z-15">
        
        {/* Banner Section */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex w-12 h-12 bg-indigo-600 rounded-2xl items-center justify-center text-white shadow-lg ring-4 ring-indigo-100 mx-auto">
            <Briefcase size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">CareerFlow AI</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">AI-Assisted Professional Workspace & Secure Identity System</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column A: Authentication Forms (Span / Scale dynamically) */}
          <div className="lg:col-span-6 xl:col-span-6">
            <motion.div 
              layout
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 space-y-6 relative"
            >
              {/* Header Switchers logic */}
              {(view === "login" || view === "register") && (
                <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`cursor-pointer flex-1 text-center py-2 text-xs font-bold rounded-xl transition duration-200 ${
                      view === "login" 
                        ? "bg-white text-slate-950 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setView("register");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`cursor-pointer flex-1 text-center py-2 text-xs font-bold rounded-xl transition duration-200 ${
                      view === "register" 
                        ? "bg-white text-slate-950 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Navigation link back if in recovery view */}
              {(view === "forgot" || view === "reset") && (
                <button
                  onClick={() => {
                    setView("login");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="group cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Sign In</span>
                </button>
              )}

              <div className="text-center">
                <h3 className="text-sm font-extrabold text-slate-900 leading-none">
                  {view === "login" && "Welcome Back to Your Journey"}
                  {view === "register" && "Register Your SaaS Account"}
                  {view === "forgot" && "Recover Your Access Details"}
                  {view === "reset" && "Secure Password Replacement"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-2 leading-normal">
                  {view === "login" && "Sign in with your credentials to access your saved resume blueprints securely."}
                  {view === "register" && "Create a customized pilot profile to begin generating tailored hiring packages."}
                  {view === "forgot" && "Type in your professional email below, and we will dispatch a secure reset email simulator."}
                  {view === "reset" && "Update your credentials here to complete the secure password reset."}
                </p>
              </div>

              {/* Alert messages */}
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-[11px] font-semibold rounded-xl flex items-center gap-2"
                >
                  <ShieldAlert size={15} className="text-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-xl flex items-center gap-2"
                >
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}

              {/* Submission Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {view === "register" && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                    <div className="relative rounded-xl shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-indigo-50 rounded-xl text-xs transition duration-150 text-slate-800 font-medium placeholder-slate-400"
                      />
                    </div>
                  </div>
                )}

                {view !== "reset" && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Professional Email</label>
                    <div className="relative rounded-xl shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={15} />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-indigo-50 rounded-xl text-xs transition duration-150 text-slate-800 font-medium placeholder-slate-400"
                      />
                    </div>
                  </div>
                )}

                {view === "reset" && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Recovery Token</label>
                    <div className="relative rounded-xl shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={15} />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. rst-xxxxx"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-indigo-50 rounded-xl text-xs transition duration-150 text-slate-800 font-medium placeholder-slate-400"
                      />
                    </div>
                  </div>
                )}

                {view !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        {view === "reset" ? "New Password" : "Secure Password"}
                      </label>
                      {view === "login" && (
                        <span 
                          onClick={navigateToForgot}
                          className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-bold"
                        >
                          Forgot details?
                        </span>
                      )}
                    </div>
                    <div className="relative rounded-xl shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={15} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-indigo-50 rounded-xl text-xs transition duration-150 text-slate-800 font-medium placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all duration-150 flex items-center justify-center gap-2 mt-2 disabled:bg-slate-300 disabled:shadow-none animate-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Processing authentication...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      <span>
                        {view === "login" && "Authenticate & Enter Workspace"}
                        {view === "register" && "Generate Secure Account"}
                        {view === "forgot" && "Send Simulated Reset Link"}
                        {view === "reset" && "Update Password & Login"}
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Informational Notice */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-[9px] text-slate-400 font-bold tracking-tight uppercase flex items-center justify-center gap-1">
                  🔑 SECURITY PROTOCOL: SHA-256 PBKDF2 ENFORCED
                </span>
              </div>
            </motion.div>
          </div>

          {/* Column B: Highly Graphic Simulated Email Inbox Sandbox */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4">
            <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-850 shadow-2xl space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Inbox size={14} className="text-indigo-400" />
                      Virtual SMTP Outbox Sandbox
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Capture simulated transaction emails live</p>
                  </div>
                </div>

                <button
                  onClick={fetchOutbox}
                  disabled={isRefreshing}
                  className="cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px]"
                >
                  <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Notice context explaining forgot password simulator */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                <p className="text-[10px] leading-relaxed text-slate-400">
                  <span className="font-bold text-indigo-400">SMTP SIMULATION:</span> In sandboxed development containers, actual outgoing mailing servers are simulated. Initiating a recovery triggers custom HTML emails parsed in real-time below. Register an account first, then try the recovery trigger!
                </p>
              </div>

              {/* Sandbox Feeds List */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {outbox.length === 0 ? (
                  <div className="py-8 text-center bg-slate-950 rounded-2xl border border-dashed border-slate-800">
                    <Send size={24} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-[11px] font-semibold text-slate-400">No simulated emails caught yet</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Click "Forgot details?" to generate a recovery message</p>
                  </div>
                ) : (
                  outbox.map((mail) => (
                    <div 
                      key={mail.id}
                      onClick={() => setSelectedEmail(selectedEmail?.id === mail.id ? null : mail)}
                      className={`cursor-pointer group p-3.5 rounded-2xl border transition-all duration-150 text-left ${
                        selectedEmail?.id === mail.id 
                          ? "bg-slate-800 border-indigo-500" 
                          : "bg-slate-950 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                          To: {mail.to}
                        </span>
                        <span className="font-mono text-[9px] flex items-center gap-1 text-slate-500">
                          <Clock size={10} />
                          {new Date(mail.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 mt-1">{mail.subject}</p>
                      
                      {/* Short excerpt / token link summary */}
                      <div className="mt-2 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px]">
                        <span className="text-indigo-300 font-mono text-[9px] font-bold">
                          Token: {mail.token}
                        </span>
                        <span className="text-indigo-400 hover:underline font-bold inline-flex items-center gap-0.5">
                          Open Email Markup 
                          <ExternalLink size={10} />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Polled summary indicator */}
              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>Last Polled: {lastPolledAt.toLocaleTimeString()}</span>
                <span>Isolated sandbox container environment</span>
              </div>
            </div>

            {/* Simulated Email Detail Panel - Rendered dynamically if selected */}
            <AnimatePresence>
              {selectedEmail && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-5 space-y-4 text-left"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 block">
                        Incoming Live Message Markup
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-950 mt-0.5">
                        Subject: {selectedEmail.subject}
                      </h4>
                    </div>
                    <button 
                      onClick={() => setSelectedEmail(null)}
                      className="cursor-pointer p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* HTML Container presentation */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/50 max-h-[300px] overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html }} 
                    />
                  </div>

                  {/* Fast simulation shortcuts */}
                  <div className="flex flex-col sm:flex-row gap-2 bg-indigo-50/70 p-3 rounded-2xl">
                    <div className="flex-1 text-[10px] text-slate-600 leading-normal font-sans">
                      <span className="font-bold text-indigo-900 uppercase block mb-0.5">🚀 Fast reset shortcut:</span>
                      Click below to bypass email copy-paste, feed verification token automatically and change this user's details.
                    </div>
                    <button
                      onClick={() => applySimulatedReset(selectedEmail)}
                      className="cursor-pointer whitespace-nowrap self-center py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition"
                    >
                      Apply Secure Token Now
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
