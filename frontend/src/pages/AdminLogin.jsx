import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      nav("/admin");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--kik-bg)] p-6">
      <form
        onSubmit={submit}
        data-testid="admin-login-form"
        className="w-full max-w-md border border-black bg-white"
      >
        <div className="border-b border-black p-6 flex items-end justify-between">
          <div>
            <div className="kik-label">/ kik admin</div>
            <h1 className="font-display text-4xl lowercase leading-none mt-2">{t.admin.login.toLowerCase()}<span className="text-[var(--kik-accent)]">.</span></h1>
          </div>
          <span className="kik-tag-dark kik-tag">v.1</span>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="kik-label">{t.admin.email}</label>
            <input
              data-testid="admin-email"
              type="email"
              required
              className="kik-input mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="kik-label">{t.admin.password}</label>
            <input
              data-testid="admin-password"
              type="password"
              required
              className="kik-input mt-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div data-testid="admin-login-error" role="alert" className="border border-[var(--kik-accent)] bg-[var(--kik-accent)] text-white px-3 py-2 text-xs font-mono uppercase tracking-[0.2em]">
              {error}
            </div>
          )}
          <button data-testid="admin-login-submit" type="submit" disabled={busy} className="kik-btn kik-btn-primary w-full">
            {busy ? "..." : `${t.admin.sign_in} →`}
          </button>
        </div>
      </form>
    </div>
  );
}
