"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeReturnPath } from "@/lib/safe-return-path";

type AlertTone = "success" | "warning" | "error";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("returnTo"), "/");
  const registerHref = returnTo === "/"
    ? "/register"
    : `/register?returnTo=${encodeURIComponent(returnTo)}`;
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<AlertTone>("error");

  const handleLogin = async () => {
    if (isSubmitting) return;
    setMessage("");
    setMessageTone("error");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const result = (await response.json()) as {
        message?: string;
        redirectTo?: string;
        role?: "pelanggan" | "admin";
      };

      if (!response.ok) {
        const errorMessage = result.message ?? "Login failed. Please try again.";
        setMessage(errorMessage);
        setMessageTone(errorMessage.toLowerCase().includes("not been approved") ? "warning" : "error");
        return;
      }

      setMessage("Login successful, redirecting...");
      setMessageTone("success");
      const destination =
        result.role === "admin" ? (result.redirectTo ?? "/admin") : returnTo;
      router.push(destination);
      router.refresh();
    } catch {
      setMessage("Unable to connect to the server.");
      setMessageTone("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #EEF4FF;
          padding: 32px 22px;
          position: relative;
          overflow: hidden;
        }

        /* Background decorations */
        .root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #DDEAFF 1px, transparent 1px);
          background-size: 30px 30px;
          opacity: 0.5;
          pointer-events: none;
        }
        .root::after {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 400px; height: 400px;
          background: radial-gradient(ellipse, rgba(100,160,255,0.14) 0%, transparent 65%);
          pointer-events: none;
        }
        .bg-blob-bottom {
          position: absolute;
          bottom: -100px; left: -80px;
          width: 350px; height: 350px;
          background: radial-gradient(ellipse, rgba(80,140,255,0.1) 0%, transparent 65%);
          pointer-events: none;
        }

        /* ── WRAPPER ── */
        .wrap {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1240px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .back-home {
          position: absolute;
          top: 18px;
          left: 18px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid #d0deff;
          color: #1a3566;
          font-size: 13.5px;
          font-weight: 600;
          transition: background 0.15s, border-color 0.15s, transform 0.15s;
        }
        .back-home:hover {
          background: #ffffff;
          border-color: #a9c4f4;
          transform: translateY(-1px);
        }
        .card {
          animation: authCardIn 0.58s ease-out forwards;
        }
        .brand {
          opacity: 0;
          transform: translateY(14px);
          animation: authPaneIn 0.52s ease-out 0.18s forwards;
        }
        .form-panel {
          opacity: 0;
          transform: translateY(14px);
          animation: authPaneIn 0.52s ease-out 0.24s forwards;
        }
        .bottom-note,
        .trust-row {
          opacity: 0;
          transform: translateY(12px);
          animation: authMetaIn 0.45s ease-out 0.34s forwards;
        }

        /* ── BRAND INSIDE CARD (LEFT) ── */
        .brand {
          width: 40%;
          min-width: 340px;
          text-align: center;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .brand-logo {
          width: 268px;
          height: auto;
          max-height: 118px;
          object-fit: contain;
          margin-bottom: 18px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .brand-tagline {
          font-size: 16px;
          color: #6A84B0;
          font-weight: 300;
          line-height: 1.6;
          max-width: 100%;
          margin: 0 auto;
        }

        /* ── FORM CARD ── */
        .card {
          width: 100%;
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid rgba(100,150,255,0.1);
          box-shadow:
            0 4px 32px rgba(10,40,120,0.08),
            inset 0 1px 0 rgba(255,255,255,0.9);
          padding: 62px 40px 38px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 32px;
          position: relative;
        }
        .divider-vertical {
          width: 1px;
          background: linear-gradient(
            180deg,
            rgba(21, 101, 216, 0.04) 0%,
            rgba(21, 101, 216, 0.18) 50%,
            rgba(21, 101, 216, 0.04) 100%
          );
        }
        .form-panel {
          flex: 1;
          min-width: 0;
        }

        .eyebrow {
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #1565D8;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .eyebrow::before {
          content: '';
          width: 20px; height: 2px;
          background: #1565D8;
          border-radius: 2px;
        }
        .form-title {
          font-size: 30px;
          font-weight: 700;
          color: #051C4A;
          margin-bottom: 4px;
          letter-spacing: -0.3px;
        }
        .form-sub {
          font-size: 15px;
          color: #6A84B0;
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: 28px;
        }
        .sep { height: 1px; background: #EDF2FF; margin-bottom: 26px; }

        /* Fields */
        .field { margin-bottom: 17px; }
        .lbl {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.4px;
          color: #1A3566;
          margin-bottom: 8px;
        }
        .iw { position: relative; }
        .inp {
          width: 100%;
          border: 1.5px solid #D0DEFF;
          border-radius: 12px;
          padding: 14px 46px 14px 16px;
          font-size: 15px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #051C4A;
          background: #F7FAFF;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .inp::placeholder { color: #9CB4D8; }
        .inp:hover { border-color: #8EB0FF; background: #fff; }
        .inp.focused {
          border-color: #1565D8;
          background: #fff;
          box-shadow: 0 0 0 3.5px rgba(21,101,216,0.11);
        }
        .ico {
          position: absolute;
          right: 15px; top: 50%;
          transform: translateY(-50%);
          color: #9CB4D8;
          font-size: 16px;
          cursor: pointer;
          user-select: none;
          transition: color 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ico:hover { color: #1565D8; }
        .pass-toggle-logo {
          width: 18px;
          height: 18px;
          object-fit: contain;
          opacity: 0.88;
        }

        /* Options */
        .opts {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 22px 0 26px;
          font-size: 14px;
        }
        .rem { display: flex; align-items: center; gap: 7px; color: #5B78A8; cursor: pointer; }
        .cbx {
          width: 17px; height: 17px;
          border: 1.5px solid #ADC8F5;
          border-radius: 4px;
          appearance: none;
          cursor: pointer;
          position: relative;
          background: #F7FAFF;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
        }
        .cbx:checked { background: #1565D8; border-color: #1565D8; }
        .cbx:checked::after {
          content: '';
          position: absolute;
          top: 2px; left: 5px;
          width: 4px; height: 7px;
          border: 2px solid #fff;
          border-top: none; border-left: none;
          transform: rotate(45deg);
        }
        .frgt { color: #1565D8; text-decoration: none; font-weight: 500; transition: color 0.15s; }
        .frgt:hover { color: #0A42A8; }

        /* Button */
        .btn {
          width: 100%;
          padding: 16px;
          background: #0B47B8;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 6px 20px rgba(11,71,184,0.35), inset 0 1px 0 rgba(255,255,255,0.14);
        }
        .btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 100%);
        }
        .btn:hover { box-shadow: 0 10px 28px rgba(11,71,184,0.45); transform: translateY(-1px); }
        .btn:active { transform: scale(0.99) translateY(0); }
        .btn-inner {
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
          position: relative; z-index: 1;
        }

        /* Below card */
        .bottom-note { text-align: center; font-size: 14px; color: #7A96C0; }
        .bottom-note a { color: #1565D8; font-weight: 600; text-decoration: none; }
        .bottom-note a:hover { color: #0A42A8; }
        .top-alert {
          width: 100%;
          margin-bottom: 14px;
          border-radius: 12px;
          padding: 12px 14px 12px 38px;
          font-size: 14.5px;
          font-weight: 500;
          border: 1px solid transparent;
          position: relative;
          animation: alertIn 0.35s ease-out;
        }
        .top-alert::before {
          content: "";
          position: absolute;
          left: 14px;
          top: 50%;
          width: 11px;
          height: 11px;
          border-radius: 999px;
          transform: translateY(-50%);
          background: currentColor;
          animation: alertDotPulse 1.4s ease-in-out infinite;
        }
        .top-alert.success {
          background: #ecfdf3;
          border-color: #b7ebcc;
          color: #166534;
        }
        .top-alert.warning {
          background: #fffbeb;
          border-color: #fde68a;
          color: #92400e;
        }
        .top-alert.error {
          background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
          border-color: #b91c1c;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(185, 28, 28, 0.45);
        }
        @keyframes alertIn {
          0% { opacity: 0; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes alertDotPulse {
          0%, 100% { transform: translateY(-50%) scale(0.9); opacity: 0.65; }
          50% { transform: translateY(-50%) scale(1.18); opacity: 1; }
        }

        .trust-row {
          display: flex; align-items: center;
          justify-content: center; gap: 12px;
          margin-top: 18px;
        }
        .trust-item { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #9CB4D8; }
        .trust-icon {
          width: 16px; height: 16px;
          border: 1.5px solid #C0D4F8;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: #7AAAF0; flex-shrink: 0;
        }
        .trust-sep { width: 3px; height: 3px; border-radius: 50%; background: #C8D8F0; }
        @keyframes authCardIn {
          0% { opacity: 0; transform: translateY(14px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes authPaneIn {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes authMetaIn {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .card {
            flex-direction: column;
            gap: 22px;
          }
          .brand {
            width: 100%;
            min-width: 0;
            padding: 2px 4px;
          }
          .divider-vertical {
            width: 100%;
            height: 1px;
            background: linear-gradient(
              90deg,
              rgba(21, 101, 216, 0.04) 0%,
              rgba(21, 101, 216, 0.18) 50%,
              rgba(21, 101, 216, 0.04) 100%
            );
          }
        }
      `}</style>

      <div className="root">
        <div className="bg-blob-bottom" />

        <div className="wrap">
          {message ? <div className={`top-alert ${messageTone}`}>{message}</div> : null}
          <div className="card">
            <a href="/" className="back-home">
              ← Back to Home
            </a>
            <div className="brand">
              <img
                src="/images/logo-telagacipta.png"
                alt="Telagacipta Indonesia"
                className="brand-logo"
              />
              <p className="brand-tagline">
                A provider of the best and finest products from Indonesia for the global market.
              </p>
            </div>

            <div className="divider-vertical" />

            <div className="form-panel">
              <p className="eyebrow">B2B Marketplace</p>
              <h2 className="form-title">Welcome!</h2>
              <p className="form-sub">Sign in to access your export dashboard.</p>
              <div className="sep" />

              <div className="field">
                <label className="lbl" htmlFor="email">Email Address</label>
                <div className="iw">
                  <input
                    id="email" type="email" placeholder="you@company.com"
                    className={`inp${focused === "email" ? " focused" : ""}`}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
                  />
                  <span className="ico">✉</span>
                </div>
              </div>

              <div className="field">
                <label className="lbl" htmlFor="password">Password</label>
                <div className="iw">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`inp${focused === "password" ? " focused" : ""}`}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setFocused("password")} onBlur={() => setFocused("")}
                  />
                  <span className="ico" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? "🙈" : "👁"}
                  </span>
                </div>
              </div>

              <div className="opts">
                <label className="rem">
                  <input
                    type="checkbox"
                    className="cbx"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  Remember me
                </label>
                <a href="#" className="frgt">Forgot password?</a>
              </div>

              <button type="button" className="btn" onClick={handleLogin} disabled={isSubmitting}>
                <span className="btn-inner">
                  {isSubmitting ? "Signing in..." : "Sign in to Marketplace"}
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <p className="bottom-note">
            Don't have an account?{" "}
            <a href={registerHref}>Register</a>
          </p>
          <div className="trust-row">
            <div className="trust-item"><div className="trust-icon">🔒</div>SSL Encrypted</div>
            <div className="trust-sep" />
            <div className="trust-item"><div className="trust-icon">✓</div>Secure Data</div>
            <div className="trust-sep" />
            <div className="trust-item"><div className="trust-icon">★</div>SNI Certified</div>
          </div>
        </div>
      </div>
    </>
  );
}