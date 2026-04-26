import React, { useRef, useState } from "react";
import api from "./api";

/**
 * Brutalist file upload — picks a file, fetches signed cloudinary params from
 * /api/cloudinary/signature, posts file directly to Cloudinary, calls onChange
 * with the secure_url. Falls back to a manual URL input when Cloudinary is not
 * configured (503).
 */
export default function FileUpload({ value, onChange, folder = "auctions", label = "image" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const pick = () => inputRef.current?.click();

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    setProgress(0);
    try {
      const sig = await api.get(`/cloudinary/signature?folder=${folder}&resource_type=image`).then((r) => r.data);
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.api_key);
      form.append("timestamp", sig.timestamp);
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const url = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`;
      // Use XHR for progress
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(json);
            else reject(new Error(json?.error?.message || `Upload failed (${xhr.status})`));
          } catch (err) {
            reject(err);
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(form);
      });
      if (result?.secure_url) onChange(result.secure_url);
      else throw new Error("No secure_url in Cloudinary response");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : err.message || "Upload failed");
    } finally {
      setBusy(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <span className="kik-label">{label}</span>
      <div className="border border-black bg-white">
        <div className="flex items-center gap-0">
          <button
            type="button"
            data-testid={`upload-btn-${folder}`}
            onClick={pick}
            disabled={busy}
            className="kik-btn flex-shrink-0 border-0 border-r border-black"
          >
            {busy ? `${progress}%` : "upload ↑"}
          </button>
          <input
            type="url"
            data-testid={`upload-url-${folder}`}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="paste url or upload"
            className="flex-1 px-3 py-2.5 font-mono text-xs uppercase tracking-[0.12em] bg-transparent outline-none"
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handle}
          className="hidden"
        />
      </div>
      {value && (
        <div className="border border-black w-28 h-28 overflow-hidden bg-[#dcdcdc]">
          <img src={value} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      {error && (
        <div data-testid={`upload-error-${folder}`} role="alert" className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--kik-accent)]">
          {error}
        </div>
      )}
    </div>
  );
}
