"use client";

import { useState, useEffect } from "react";
import {
  FolderOpen,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
} from "lucide-react";

export default function CustomerFilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchFiles);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("File exceeds 15MB maximum size limit.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("relatedType", "customer_asset");

    try {
      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccessMsg(`"${file.name}" uploaded successfully.`);
      fetchFiles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#202223] flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-[#008060]" />
          Store Files & Screenshots
        </h1>
        <p className="text-xs text-[#6d7175] mt-0.5">
          Upload store screenshots, design mockups, error screen captures, or theme assets for your Shopify team.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white border-2 border-dashed border-gray-300 hover:border-[#008060] rounded-2xl p-6 sm:p-8 text-center transition">
        <UploadCloud className="w-10 h-10 text-[#008060] mx-auto mb-2" />
        <h2 className="text-sm font-bold text-[#202223]">Upload Screenshots & Documents</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Supported file types: PNG, JPG, WebP, PDF, DOCX, ZIP, TXT. (Maximum 15MB per file).
        </p>

        {uploading ? (
          <div className="mt-4 text-xs font-semibold text-[#008060] animate-pulse">
            Uploading and registering asset...
          </div>
        ) : (
          <label className="mt-4 inline-block bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition shadow-xs">
            <span>Select File to Upload</span>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.docx,.zip,.txt"
            />
          </label>
        )}

        {error && (
          <div className="mt-4 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg inline-flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008060]" />
            {successMsg}
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="bg-white border border-[#e1e3e5] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Uploaded Files ({files.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No files uploaded yet. Upload bug screenshots or store assets above.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {files.map((file) => {
              const isImage = file.fileType.startsWith("image/");
              return (
                <div
                  key={file.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                      {isImage ? (
                        <ImageIcon className="w-5 h-5 text-[#008060]" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#202223] truncate">
                        {file.fileName}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                        <span>{formatBytes(file.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded {new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-[#008060] rounded-lg hover:bg-emerald-50 transition"
                    title="Download / View"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
