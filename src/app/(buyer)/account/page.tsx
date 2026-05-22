"use client";

import { useEffect, useState } from "react";
import { alertFailBanner } from "@/lib/alertFailBanner";
import { profileInitials } from "@/lib/profile-initials";

type BuyerProfile = {
  nama: string;
  email: string;
  instansi: string;
  no_telepon: string;
  alamat: string;
  negara: string;
};

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BuyerAccountProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const loadProfile = async () => {
    const res = await fetch("/api/auth/profile", { cache: "no-store" });
    const data = (await res.json()) as { profile?: BuyerProfile; message?: string };
    if (!res.ok) {
      throw new Error(data.message ?? "Failed to load profile.");
    }
    return data.profile ?? null;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await loadProfile();
        if (!cancelled) setProfile(p);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveAddress = async () => {
    setError("");
    setSuccess("");
    setSavingAddress(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alamat: addressDraft }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Failed to update address.");
        return;
      }
      setProfile((prev) => (prev ? { ...prev, alamat: addressDraft.trim() } : prev));
      setEditingAddress(false);
      setSuccess(data.message ?? "Address updated.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setPasswordError(data.message ?? "Failed to update password.");
        return;
      }
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(data.message ?? "Password updated.");
      setError("");
    } catch {
      setPasswordError("Could not reach the server.");
    } finally {
      setSavingPassword(false);
    }
  };

  const startEditAddress = () => {
    if (!profile) return;
    setAddressDraft(profile.alamat);
    setEditingAddress(true);
    setError("");
    setSuccess("");
  };

  const personalFields = profile
    ? [
        { label: "Full name", value: profile.nama },
        { label: "Institution", value: profile.instansi },
        { label: "Country", value: profile.negara },
        { label: "Phone number", value: profile.no_telepon },
      ]
    : [];

  return (
    <>
      <div className="account-page">
        <header className="account-page-header">
          <h1 className="account-page-title">Profile</h1>
          <p className="account-page-subtitle">Your account information for quotation and orders.</p>
        </header>

        {error ? <p className="account-page-error">{error}</p> : null}
        {success ? <p className="account-page-success">{success}</p> : null}

        {loading ? (
          <div className="account-profile-card account-profile-card--skeleton" aria-busy="true">
            <div className="account-skeleton-line" style={{ height: 88, width: 88, borderRadius: "50%" }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="account-skeleton-section">
                <div className="account-skeleton-line" style={{ height: 14, width: 140 }} />
                <div className="account-skeleton-grid">
                  {Array.from({ length: 2 }).map((__, j) => (
                    <div key={j} className="account-skeleton-field" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : profile ? (
          <div className="account-profile-card">
            <div className="account-profile-hero">
              <div className="account-profile-avatar-lg" aria-hidden>
                {profileInitials(profile.nama)}
              </div>
              <div>
                <p className="account-profile-hero-name">{profile.nama}</p>
                <p className="account-profile-hero-email">{profile.email}</p>
              </div>
            </div>

            <section className="account-profile-section">
              <h2 className="account-profile-section-title">Personal profile</h2>
              <div className="account-profile-grid">
                {personalFields.map((field) => (
                  <div key={field.label} className="account-profile-field">
                    <span className="account-profile-label">{field.label}</span>
                    <p className="account-profile-value">{field.value || "—"}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="account-profile-section">
              <h2 className="account-profile-section-title">Account Info</h2>
              <div className="account-info-list">
                <div className="account-info-row">
                  <span className="account-profile-label">Email address</span>
                  <div className="account-info-control">
                    <input
                      type="email"
                      className="account-info-input"
                      value={profile.email}
                      readOnly
                      aria-readonly
                    />
                    <span className="account-verified-badge">
                      <IconCheck />
                      Verified
                    </span>
                  </div>
                </div>
                <div className="account-info-row">
                  <span className="account-profile-label">Password</span>
                  <div className="account-info-control">
                    <input
                      type="password"
                      className="account-info-input"
                      value="••••••••••••"
                      readOnly
                      aria-readonly
                    />
                    <button
                      type="button"
                      className="account-btn-primary"
                      onClick={() => {
                        setPasswordOpen(true);
                        setPasswordError("");
                      }}
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="account-profile-section account-profile-section--last">
              <div className="account-address-header">
                <h2 className="account-profile-section-title">Address</h2>
                {!editingAddress ? (
                  <button type="button" className="account-link-btn" onClick={startEditAddress}>
                    Edit
                  </button>
                ) : null}
              </div>

              {editingAddress ? (
                <div className="account-address-edit">
                  <label className="account-profile-label" htmlFor="address-edit">
                    Address
                  </label>
                  <textarea
                    id="address-edit"
                    className="account-address-textarea"
                    value={addressDraft}
                    onChange={(e) => setAddressDraft(e.target.value)}
                    rows={4}
                    maxLength={255}
                  />
                  <div className="account-address-actions">
                    <button
                      type="button"
                      className="account-btn-secondary"
                      onClick={() => setEditingAddress(false)}
                      disabled={savingAddress}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="account-btn-primary"
                      onClick={handleSaveAddress}
                      disabled={savingAddress || !addressDraft.trim()}
                    >
                      {savingAddress ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="account-address-card">
                  <p className="account-profile-value account-address-text">
                    {profile.alamat || "—"}
                  </p>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>

      {passwordOpen ? (
        <div
          className="account-modal-overlay"
          onClick={() => !savingPassword && setPasswordOpen(false)}
          role="presentation"
        >
          <div
            className="account-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="change-password-title"
          >
            <div className="account-modal-header">
              <h3 id="change-password-title">Change Password</h3>
              <button
                type="button"
                className="account-modal-close"
                onClick={() => setPasswordOpen(false)}
                disabled={savingPassword}
                aria-label="Close"
              >
                <IconClose />
              </button>
            </div>
            <form className="account-modal-body" onSubmit={handleChangePassword}>
              {passwordError ? (
                <p className="account-page-error account-modal-error">{passwordError}</p>
              ) : null}
              <label className="account-modal-field">
                <span className="account-profile-label">Current password</span>
                <input
                  type="password"
                  className="account-info-input account-info-input--full"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <label className="account-modal-field">
                <span className="account-profile-label">New password</span>
                <input
                  type="password"
                  className="account-info-input account-info-input--full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="account-modal-field">
                <span className="account-profile-label">Confirm new password</span>
                <input
                  type="password"
                  className="account-info-input account-info-input--full"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <p className="account-password-hint">
                Min 8 characters, uppercase, lowercase, and special character.
              </p>
              <button type="submit" className="account-btn-primary account-btn-primary--block" disabled={savingPassword}>
                {savingPassword ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <style>{`
        .account-page {
          animation: accountPageIn 0.4s ease-out both;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        @keyframes accountPageIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes accountShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .account-page-header { margin-bottom: 24px; }
        .account-page-title {
          margin: 0 0 6px;
          font-size: 32px;
          font-weight: 700;
          color: #051c4a;
        }
        .account-page-subtitle {
          margin: 0;
          font-size: 16px;
          color: #6a84b0;
        }
        .account-page-error {
          margin: 0 0 16px;
          padding: 12px 14px;
          border-radius: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          font-size: 14px;
        }
        .account-page-success {
          margin: 0 0 16px;
          padding: 12px 14px;
          border-radius: 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 14px;
          font-weight: 500;
        }
        .account-profile-card {
          background: #fff;
          border: 1px solid #d0deff;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 18px rgba(10, 40, 120, 0.06);
        }
        .account-profile-hero {
          display: flex;
          align-items: center;
          gap: 20px;
          padding-bottom: 24px;
          margin-bottom: 8px;
        }
        .account-profile-avatar-lg {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: linear-gradient(145deg, #0b47b8, #1a5fd4);
          color: #fff;
          font-size: 28px;
          font-weight: 700;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .account-profile-hero-name {
          margin: 0 0 4px;
          font-size: 22px;
          font-weight: 700;
          color: #051c4a;
        }
        .account-profile-hero-email {
          margin: 0;
          font-size: 15px;
          color: #6a84b0;
        }
        .account-profile-section {
          padding-top: 24px;
          margin-top: 24px;
          border-top: 1px solid #edf2ff;
        }
        .account-profile-section--last {
          padding-bottom: 4px;
        }
        .account-profile-section-title {
          margin: 0 0 16px;
          font-size: 17px;
          font-weight: 700;
          color: #051c4a;
        }
        .account-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .account-profile-field,
        .account-address-card {
          background: #f7faff;
          border: 1px solid #edf2ff;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .account-profile-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #6a84b0;
          margin-bottom: 6px;
        }
        .account-profile-value {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #1a3566;
          word-break: break-word;
        }
        .account-info-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .account-info-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .account-info-control {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .account-info-input {
          flex: 1;
          min-width: 200px;
          padding: 11px 14px;
          border: 1px solid #d0deff;
          border-radius: 10px;
          background: #f7faff;
          font-size: 15px;
          font-weight: 500;
          color: #1a3566;
          font-family: inherit;
        }
        .account-info-input--full {
          width: 100%;
          min-width: 0;
        }
        .account-info-input:focus {
          outline: none;
          border-color: #93b4ff;
          box-shadow: 0 0 0 3px rgba(11, 71, 184, 0.12);
        }
        .account-verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid #16a34a;
          color: #16a34a;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .account-btn-primary {
          border: none;
          border-radius: 999px;
          padding: 10px 18px;
          background: #0b47b8;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease, box-shadow 0.15s ease;
        }
        .account-btn-primary:hover:not(:disabled) {
          background: #0d3fa0;
          box-shadow: 0 4px 14px rgba(11, 71, 184, 0.28);
        }
        .account-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .account-btn-primary--block {
          width: 100%;
          margin-top: 4px;
        }
        .account-btn-secondary {
          border: 1px solid #c9dcff;
          border-radius: 999px;
          padding: 10px 18px;
          background: #fff;
          color: #0b47b8;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
        }
        .account-link-btn {
          border: none;
          background: none;
          padding: 0;
          color: #0b47b8;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
        }
        .account-link-btn:hover {
          color: #0d3fa0;
          text-decoration: underline;
        }
        .account-address-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .account-address-header .account-profile-section-title {
          margin-bottom: 0;
        }
        .account-address-text {
          line-height: 1.5;
        }
        .account-address-edit {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .account-address-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #d0deff;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          color: #1a3566;
          resize: vertical;
          min-height: 100px;
        }
        .account-address-textarea:focus {
          outline: none;
          border-color: #93b4ff;
          box-shadow: 0 0 0 3px rgba(11, 71, 184, 0.12);
        }
        .account-address-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .account-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 28, 74, 0.4);
          backdrop-filter: blur(3px);
          display: grid;
          place-items: center;
          z-index: 80;
          padding: 16px;
        }
        .account-modal {
          width: min(440px, 100%);
          background: #fff;
          border-radius: 16px;
          border: 1px solid #d0deff;
          box-shadow: 0 20px 50px rgba(10, 40, 120, 0.22);
        }
        .account-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid #edf2ff;
          background: #f7faff;
        }
        .account-modal-header h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #051c4a;
        }
        .account-modal-close {
          border: 1px solid #d0deff;
          border-radius: 999px;
          background: #fff;
          color: #6a84b0;
          cursor: pointer;
          display: inline-flex;
          padding: 5px;
        }
        .account-modal-body {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .account-modal-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .account-modal-error {
          margin: 0;
        }
        .account-password-hint {
          margin: 0;
          font-size: 12px;
          color: #6a84b0;
        }
        .account-skeleton-line {
          background: linear-gradient(90deg, #e6edf9 0%, #f5f8ff 45%, #e6edf9 90%);
          background-size: 200% 100%;
          animation: accountShimmer 1.35s ease-in-out infinite;
          border-radius: 8px;
        }
        .account-skeleton-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #edf2ff;
        }
        .account-skeleton-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 12px;
        }
        .account-skeleton-field {
          height: 64px;
          border-radius: 10px;
          background: linear-gradient(90deg, #e6edf9 0%, #f5f8ff 45%, #e6edf9 90%);
          background-size: 200% 100%;
          animation: accountShimmer 1.35s ease-in-out infinite;
        }
        @media (max-width: 700px) {
          .account-profile-grid,
          .account-skeleton-grid {
            grid-template-columns: 1fr;
          }
          .account-profile-hero {
            flex-direction: column;
            text-align: center;
          }
          .account-info-control {
            flex-direction: column;
            align-items: stretch;
          }
          .account-verified-badge,
          .account-btn-primary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
