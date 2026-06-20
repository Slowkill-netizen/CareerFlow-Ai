import React, { useState, useRef } from "react";
import { UploadCloud, FileText, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

interface ResumeUploadProps {
  onTextExtracted: (text: string) => void;
  className?: string;
}

export default function ResumeUpload({ onTextExtracted, className = "" }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB standard max limit

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(null);

    // Validate file extensions and MIME types
    const validMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const extension = file.name.split(".").pop()?.toLowerCase();
    const isValidType = validMimes.includes(file.type) || ["pdf", "docx"].includes(extension || "");

    if (!isValidType) {
      setError("CareerFlow AI accepts standard PDF (.pdf) and Microsoft Word (.docx) formats only.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File exceeds 5MB size limit. Please upload a smaller compressed document.");
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("cf_token");
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Parsing failed with server status ${response.status}`);
      }

      if (data.text) {
        onTextExtracted(data.text);
      } else {
        throw new Error("No readable text found after analyzing document format structures.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process and parse candidate document.");
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFileInput}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all duration-200 flex flex-col items-center justify-center space-y-2 select-none ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/50"
            : isUploading
            ? "border-slate-300 bg-slate-50/50 cursor-not-allowed"
            : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-2 py-1">
            <Loader2 size={24} className="text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-700">Extracting content from '{fileName}'...</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">In-Memory Text Segmentation</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center space-y-1.5 py-1">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="text-xs font-bold text-slate-800">Successfully extracted!</p>
            <p className="text-[10px] text-slate-500 font-medium">Form filled with content from '{fileName}'</p>
          </div>
        ) : (
          <>
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <UploadCloud size={20} className={isDragging ? "scale-110 transition-transform" : ""} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">
                Drag & drop your resume (PDF/DOCX) or <span className="text-indigo-600 hover:underline">browse files</span>
              </p>
              <p className="text-[10px] text-slate-400">Accepts .pdf and .docx files (Max 5MB)</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700 font-semibold shadow-3xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
