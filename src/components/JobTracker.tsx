import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  DollarSign, 
  Calendar, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle,
  Briefcase,
  ChevronRight,
  MoveRight,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Award,
  XCircle,
  X,
  Sparkles,
  Info
} from "lucide-react";
import { JobApplication, JobStatus } from "../types";

interface JobTrackerProps {
  applications: JobApplication[];
  onAddApplication: (app: Omit<JobApplication, "id">) => void;
  onUpdateApplication?: (id: string, app: Partial<JobApplication>) => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
  onDeleteApplication: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const STATUS_COLUMNS: { id: JobStatus; label: string; bg: string; border: string; text: string; dot: string }[] = [
  { id: "wishlist", label: "Wishlist", bg: "bg-purple-50/50", border: "border-purple-100", text: "text-purple-750", dot: "bg-purple-500" },
  { id: "applied", label: "Applied", bg: "bg-blue-50/50", border: "border-blue-100", text: "text-blue-750", dot: "bg-blue-550" },
  { id: "interviewing", label: "Interviewing", bg: "bg-amber-50/50", border: "border-amber-100", text: "text-amber-750", dot: "bg-amber-500" },
  { id: "offer", label: "Offer Received", bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-750", dot: "bg-emerald-555" },
  { id: "rejected", label: "Rejected / Ended", bg: "bg-rose-50/50", border: "border-rose-100", text: "text-rose-750", dot: "bg-rose-500" }
];

export default function JobTracker({
  applications = [],
  onAddApplication,
  onUpdateApplication,
  onUpdateStatus,
  onDeleteApplication,
  isLoading = false,
  error = null
}: JobTrackerProps) {
  // UI states
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<"desc" | "asc">("desc");

  // Form input fields
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<JobStatus>("applied");
  const [salary, setSalary] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [jdText, setJdText] = useState("");
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  // Whenever we edit an application, populate the form input states
  useEffect(() => {
    if (editingApp) {
      setCompany(editingApp.company);
      setRole(editingApp.role);
      setStatus(editingApp.status);
      setSalary(editingApp.salary || "");
      setJdUrl(editingApp.jdUrl || "");
      setJdText(editingApp.jdText || "");
      setAppliedDate(editingApp.appliedDate);
      setNotes(editingApp.notes || "");
    } else {
      setCompany("");
      setRole("");
      setStatus("applied");
      setSalary("");
      setJdUrl("");
      setJdText("");
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setNotes("");
    }
  }, [editingApp]);

  // Handle addition or edit submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    const appData = {
      company: company.trim(),
      role: role.trim(),
      status,
      salary: salary.trim() || undefined,
      jdUrl: jdUrl.trim() || undefined,
      jdText: jdText.trim() || undefined,
      appliedDate,
      notes: notes.trim() || undefined
    };

    if (editingApp) {
      if (onUpdateApplication) {
        onUpdateApplication(editingApp.id, appData);
      }
    } else {
      onAddApplication(appData);
    }

    // Reset details
    setEditingApp(null);
    setShowForm(false);
  };

  // Trigger form context for brand new cards
  const triggerAddForm = () => {
    setEditingApp(null);
    setShowForm(true);
  };

  // Trigger form context for existing cards
  const triggerEditForm = (app: JobApplication) => {
    setEditingApp(app);
    setShowForm(true);
  };

  // Execute deletion confirmation
  const triggerDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteApplication(deletingId);
      setDeletingId(null);
    }
  };

  // Calculated Statistics
  const totalApps = applications.length;
  const interviewCount = applications.filter(app => app.status === "interviewing").length;
  const offerCount = applications.filter(app => app.status === "offer").length;
  const rejectedCount = applications.filter(app => app.status === "rejected").length;
  const successRate = totalApps > 0 ? Math.round((offerCount / totalApps) * 100) : 0;

  // Filter and Sort applications
  const processedApplications = applications
    .filter(app => {
      const matchSearch = 
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchStatus = statusFilter === "all" || app.status === statusFilter;
      
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.appliedDate).getTime();
      const dateB = new Date(b.appliedDate).getTime();
      return dateSort === "desc" ? dateB - dateA : dateA - dateB;
    });

  // Helper to categorize items for column display (when not sorting/filtering heavily)
  const getAppsForColumn = (colId: JobStatus) => {
    return processedApplications.filter(app => app.status === colId);
  };

  return (
    <div className="space-y-6">
      {/* Board Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1 px-1.5 text-xs bg-indigo-50 text-indigo-600 rounded font-black uppercase tracking-wider">REST Sync</span>
            Production Job Application Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Add, update, filter, and prioritize your active interview processes. Changes are secured with your user profile.
          </p>
        </div>
        <button
          onClick={triggerAddForm}
          className="cursor-pointer inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition self-start md:self-center"
        >
          <Plus size={15} />
          <span>Add Position</span>
        </button>
      </div>

      {/* Server Loading / Error banners */}
      {isLoading && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 text-xs text-indigo-750">
          <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-semibold">Syncing tracker changes live with backend servers...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-150 rounded-xl flex items-center gap-2 text-xs text-red-700 font-semibold">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bonus: Statistics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Applications</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-800">{totalApps}</span>
            <span className="text-[10px] text-slate-400 font-semibold font-sans">positions</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interviews Scheduled</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-600">{interviewCount}</span>
            <span className="text-[10px] text-amber-500 font-semibold font-sans">ongoing</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Offers Earned</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-600">{offerCount}</span>
            <span className="text-[10px] text-emerald-500 font-semibold font-sans">offers</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">unsuccessful / rejected</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-rose-600">{rejectedCount}</span>
            <span className="text-[10px] text-rose-500 font-semibold font-sans">records</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">ATS Placement Success</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-indigo-650">{successRate}%</span>
            <div className="flex-1 max-w-[40px] bg-slate-100 rounded-full h-1.5 overflow-hidden self-center">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${successRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search size={14} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, role, or progress notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-150 rounded-xl transition"
          />
        </div>

        {/* Status Filtering */}
        <div className="md:col-span-3 flex items-center gap-2">
          <Filter size={13} className="text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition outline-none"
          >
            <option value="all">Display All Pipeline Levels</option>
            <option value="wishlist">Wishlist</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer Received</option>
            <option value="rejected">Rejected / Ended</option>
          </select>
        </div>

        {/* Time sorting */}
        <div className="md:col-span-3 flex items-center gap-2">
          <ArrowUpDown size={13} className="text-slate-400 shrink-0" />
          <select
            value={dateSort}
            onChange={e => setDateSort(e.target.value as "desc" | "asc")}
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition outline-none"
          >
            <option value="desc">Sort by Date: Newest First</option>
            <option value="asc">Sort by Date: Oldest First</option>
          </select>
        </div>

        {/* Clear Filters (if active) */}
        {(searchQuery || statusFilter !== "all") && (
          <div className="md:col-span-1 text-right">
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-indigo-650 transition block underline text-center md:text-right"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Grid of Columns or Filter list fallback */}
      {statusFilter !== "all" ? (
        // List style view when filtering specific stage
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filtered Stage Results ({processedApplications.length})
            </h3>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded tracking-normal">
              Stage: {statusFilter.toUpperCase()}
            </span>
          </div>

          {processedApplications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No matching applications found with status "{statusFilter}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedApplications.map(app => (
                <div 
                  key={app.id} 
                  className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3 relative group hover:border-indigo-200 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{app.company}</h4>
                      <p className="text-slate-500 text-xs font-medium leading-tight mt-0.5">{app.role}</p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition">
                      <button
                        onClick={() => triggerEditForm(app)}
                        className="p-1 cursor-pointer text-slate-500 hover:text-indigo-600 transition"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={(e) => triggerDelete(app.id, e)}
                        className="p-1 cursor-pointer text-slate-500 hover:text-rose-600 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 text-[11px] text-slate-450 text-slate-500">
                    {app.salary && (
                      <div className="flex items-center gap-1 bg-white border px-2 py-0.5 rounded-md">
                        <DollarSign size={11} className="text-slate-400" />
                        <span>{app.salary}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 bg-white border px-2 py-0.5 rounded-md">
                      <Calendar size={11} className="text-slate-400" />
                      <span>{new Date(app.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {app.notes && (
                    <p className="text-[11px] text-slate-500 bg-white/70 p-2.5 border border-slate-100 rounded-lg max-h-20 overflow-y-auto leading-relaxed">
                      {app.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold uppercase">Quick Change:</span>
                    <select
                      value={app.status}
                      onChange={e => onUpdateStatus(app.id, e.target.value as JobStatus)}
                      className="bg-indigo-50/70 border border-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-lg text-[10px] outline-none"
                    >
                      {STATUS_COLUMNS.map(column => (
                        <option key={column.id} value={column.id}>{column.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Standard high-fidelity Column Board view
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          {STATUS_COLUMNS.map(col => {
            const colApps = getAppsForColumn(col.id);

            return (
              <div 
                key={col.id} 
                className={`rounded-2xl p-4 border ${col.border} ${col.bg} space-y-4 shadow-3xs flex flex-col`}
              >
                {/* Column heading */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5 col-span-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h3 className="font-bold text-slate-800 text-xs tracking-tight uppercase leading-none">
                      {col.label}
                    </h3>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-white border border-slate-150 text-slate-500">
                    {colApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 min-h-[350px]">
                  {colApps.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200/60 bg-white/40 rounded-xl py-12 text-center text-slate-405 italic text-slate-400 text-[10px] font-medium leading-relaxed">
                      No positions configured
                    </div>
                  ) : (
                    colApps.map(app => (
                      <motion.div
                        key={app.id}
                        layoutId={`app-card-${app.id}`}
                        className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-3 hover:border-indigo-200 hover:shadow-1 transition relative group"
                      >
                        {/* Title details */}
                        <div className="flex justify-between items-start gap-1">
                          <div className="flex-1 leading-tight min-w-0">
                            <h4 className="font-bold text-slate-800 text-xs select-none truncate" title={app.company}>
                              {app.company}
                            </h4>
                            <p className="text-slate-500 text-[11px] font-semibold mt-0.5 truncate" title={app.role}>
                              {app.role}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                            <button
                              onClick={() => triggerEditForm(app)}
                              className="p-0.5 cursor-pointer text-slate-400 hover:text-indigo-600 transition"
                              title="Edit position"
                            >
                              <Edit size={11} />
                            </button>
                            <button
                              onClick={(e) => triggerDelete(app.id, e)}
                              className="p-0.5 cursor-pointer text-slate-400 hover:text-rose-600 transition"
                              title="Remove position"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="space-y-1">
                          {app.salary && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <DollarSign size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{app.salary}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Calendar size={11} className="text-slate-450 shrink-0" />
                            <span>{new Date(app.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>

                        {app.notes && (
                          <p className="text-[10px] text-slate-400 border-t pt-2 line-clamp-2 leading-relaxed">
                            {app.notes}
                          </p>
                        )}

                        {/* Stage quick change dropdown */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                          <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">Pipeline Stage:</span>
                          <select
                            value={app.status}
                            onChange={e => onUpdateStatus(app.id, e.target.value as JobStatus)}
                            className="text-[10px] bg-slate-50 border hover:bg-slate-100 text-slate-700 font-bold px-1 py-0.5 rounded-md select-none cursor-pointer outline-none max-w-[100px]"
                          >
                            {STATUS_COLUMNS.map(column => (
                              <option key={column.id} value={column.id}>{column.label}</option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over sheet/modal for adding/editing job cards */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-3xs p-4">
            <motion.div
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-lg h-full rounded-2xl shadow-2xl p-6 flex flex-col overflow-y-auto border-l"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">
                      {editingApp ? "Edit Existing Job Card" : "Add New Job Card"}
                    </h2>
                    <p className="text-[10px] text-slate-404 text-slate-500 font-medium">
                      {editingApp ? "Make changes to your active pipeline parameters." : "Pre-evaluate another application record."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-55 rounded-full transition"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Google, Stripe"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 transition bg-slate-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Role Title *</label>
                    <input
                      type="text"
                      required
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      placeholder="e.g. Backend Architect"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 transition bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pipeline Stage</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as JobStatus)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 bg-slate-50 transition"
                    >
                      {STATUS_COLUMNS.map(col => (
                        <option key={col.id} value={col.id}>{col.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Date Applied</label>
                    <input
                      type="date"
                      value={appliedDate}
                      onChange={e => setAppliedDate(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 bg-slate-50 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estimated Salary or Compensation</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <DollarSign size={13} />
                    </div>
                    <input
                      type="text"
                      value={salary}
                      onChange={e => setSalary(e.target.value)}
                      placeholder="e.g. $140,000 - $170,000"
                      className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 bg-slate-50 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Job Listing link / URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <LinkIcon size={12} />
                    </div>
                    <input
                      type="url"
                      value={jdUrl}
                      onChange={e => setJdUrl(e.target.value)}
                      placeholder="https://careers.company.com/job"
                      className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 bg-slate-50 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Job Description (for ATS optimization)</label>
                  <textarea
                    rows={4}
                    value={jdText}
                    onChange={e => setJdText(e.target.value)}
                    placeholder="Paste the exact responsibilities, certifications, and stack parameters here..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 bg-slate-50 transition font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Personal notes / Next Steps</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Completed screen loop. Follow up with HR contact on Friday."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 bg-slate-50 transition font-sans"
                  />
                </div>

                <div className="pt-4 flex items-center gap-2 border-t mt-4">
                  <button
                    type="submit"
                    className="cursor-pointer flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    {editingApp ? "Save App Edits" : "Create Card"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-650 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border text-center space-y-4"
            >
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">Delete Application Card?</h3>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  Are you sure you want to permanently remove this position from your CareerFlow pipeline? This operation cannot be undone.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={confirmDelete}
                  className="cursor-pointer flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
                >
                  Yes, Delete Card
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="cursor-pointer flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
