"use client";

import { useRef, useState } from "react";
import { AlertCircle, Paperclip } from "lucide-react";

type ChatAttachmentButtonProps = {
  conversationId: string;
  customerId?: string;
  agentMode?: boolean;
  disabled?: boolean;
  onSent: (message: any) => void;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export function ChatAttachmentButton({ conversationId, customerId, agentMode = false, disabled = false, onSent }: ChatAttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("Files must be 15 MB or smaller.");
      return;
    }
    if (!ACCEPTED_TYPES.split(",").includes(file.type)) {
      setError("Choose a JPG, PNG, WebP, GIF, PDF, DOCX, ZIP, or TXT file.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("relatedType", "conversation");
      formData.append("relatedId", conversationId);
      if (agentMode && customerId) formData.append("customerId", customerId);

      const uploadResponse = await fetch("/api/files", { method: "POST", body: formData });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error || "File upload failed");

      const messageResponse = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: "", attachments: [{ id: uploadData.file.id }] }),
      });
      const messageData = await messageResponse.json();
      if (!messageResponse.ok) throw new Error(messageData.error || "Could not send attachment");
      onSent(messageData.message);
    } catch (uploadError: any) {
      setError(uploadError.message || "Could not send attachment");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} className="hidden" onChange={handleSelection} />
      <button
        type="button"
        title={uploading ? "Uploading file" : "Attach an image or file"}
        aria-label="Attach an image or file"
        disabled={disabled || uploading || !conversationId}
        onClick={() => inputRef.current?.click()}
        className={agentMode
          ? "rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-300 hover:text-white disabled:opacity-40"
          : "rounded-lg border border-[#e1e3e5] bg-white p-2.5 text-gray-500 hover:text-[#008060] disabled:opacity-40"}
      >
        {uploading ? <span className="text-[10px]">...</span> : <Paperclip className="h-4 w-4" />}
      </button>
      {error && (
        <div role="alert" className={`absolute bottom-full left-0 z-20 mb-2 flex w-56 items-start gap-1.5 rounded-md border p-2 text-[10px] shadow-lg ${agentMode ? "border-red-800 bg-red-950 text-red-200" : "border-red-200 bg-white text-red-700"}`}>
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss upload error" className="ml-auto">×</button>
        </div>
      )}
    </div>
  );
}
