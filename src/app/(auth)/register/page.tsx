"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");

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
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }
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

        .wrap {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 980px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .back-home {
          position: absolute;
          top: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid #d0deff;
          color: #1a3566;
          font-size: 12px;
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

        .brand {
          width: 40%;
          min-width: 280px;
          text-align: center;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .brand-logo {
          width: 210px;
          height: auto;
          max-height: 96px;
          object-fit: contain;
          margin-bottom: 14px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .brand-tagline {
          font-size: 15px;
          color: #6A84B0;
          font-weight: 300;
          line-height: 1.6;
          max-width: 100%;
          margin: 0 auto;
        }

        .card {
          width: 100%;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(100,150,255,0.1);
          box-shadow: 0 4px 32px rgba(10,40,120,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
          padding: 52px 28px 28px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 24px;
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
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #1565D8;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .eyebrow::before {
          content: '';
          width: 18px; height: 2px;
          background: #1565D8;
          border-radius: 2px;
        }
        .form-title {
          font-size: 24px;
          font-weight: 700;
          color: #051C4A;
          margin-bottom: 4px;
          letter-spacing: -0.3px;
        }
        .form-sub {
          font-size: 13px;
          color: #6A84B0;
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: 22px;
        }
        .sep { height: 1px; background: #EDF2FF; margin-bottom: 20px; }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .field { margin-bottom: 14px; }
        .field-full { grid-column: 1 / -1; }
        .lbl {
          display: block;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.4px;
          color: #1A3566;
          margin-bottom: 7px;
        }
        .iw { position: relative; }
        .inp {
          width: 100%;
          border: 1.5px solid #D0DEFF;
          border-radius: 10px;
          padding: 12px 40px 12px 14px;
          font-size: 13.5px;
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
        .inp-area {
          resize: vertical;
          min-height: 92px;
          padding-right: 14px;
        }
        .ico {
          position: absolute;
          right: 13px; top: 50%;
          transform: translateY(-50%);
          color: #9CB4D8;
          font-size: 15px;
          user-select: none;
        }
        .ico-clickable { cursor: pointer; transition: color 0.15s; }
        .ico-clickable:hover { color: #1565D8; }

        .btn {
          width: 100%;
          margin-top: 8px;
          padding: 13px;
          background: #0B47B8;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
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

        .bottom-note { text-align: center; font-size: 13px; color: #7A96C0; }
        .bottom-note a { color: #1565D8; font-weight: 600; text-decoration: none; }
        .bottom-note a:hover { color: #0A42A8; }

        .trust-row {
          display: flex; align-items: center;
          justify-content: center; gap: 10px;
          margin-top: 16px;
        }
        .trust-item { display: flex; align-items: center; gap: 4px; font-size: 10.5px; color: #9CB4D8; }
        .trust-icon {
          width: 14px; height: 14px;
          border: 1.5px solid #C0D4F8;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; color: #7AAAF0; flex-shrink: 0;
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
            gap: 18px;
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
        @media (max-width: 700px) {
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="root">
        <div className="bg-blob-bottom" />

        <div className="wrap">
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
              <h2 className="form-title">Create your account</h2>
              <p className="form-sub">Register to access supplier and export dashboards.</p>
              <div className="sep" />

              <div className="grid">
              <div className="field">
                <label className="lbl" htmlFor="nama">Full Name</label>
                <div className="iw">
                  <input
                    id="nama"
                    type="text"
                    placeholder="Enter your full name"
                    className={`inp${focused === "nama" ? " focused" : ""}`}
                    onFocus={() => setFocused("nama")}
                    onBlur={() => setFocused("")}
                  />
                </div>
              </div>

              <div className="field">
                <label className="lbl" htmlFor="instansi">Institution</label>
                <div className="iw">
                  <input
                    id="instansi"
                    type="text"
                    placeholder="Institution name"
                    className={`inp${focused === "instansi" ? " focused" : ""}`}
                    onFocus={() => setFocused("instansi")}
                    onBlur={() => setFocused("")}
                  />
                </div>
              </div>

              <div className="field">
                <label className="lbl" htmlFor="telp">Phone Number</label>
                <div className="iw">
                  <input
                    id="telp"
                    type="tel"
                    placeholder="+62 812 xxxx xxxx"
                    className={`inp${focused === "telp" ? " focused" : ""}`}
                    onFocus={() => setFocused("telp")}
                    onBlur={() => setFocused("")}
                  />
                </div>
              </div>

              <div className="field">
                <label className="lbl" htmlFor="negara">Country</label>
                <div className="iw">
                  <input
                    id="negara"
                    type="text"
                    placeholder="Indonesia"
                    className={`inp${focused === "negara" ? " focused" : ""}`}
                    onFocus={() => setFocused("negara")}
                    onBlur={() => setFocused("")}
                  />
                </div>
              </div>

              <div className="field field-full">
                <label className="lbl" htmlFor="alamat">Address</label>
                <div className="iw">
                  <textarea
                    id="alamat"
                    placeholder="Enter full address"
                    className={`inp inp-area${focused === "alamat" ? " focused" : ""}`}
                    onFocus={() => setFocused("alamat")}
                    onBlur={() => setFocused("")}
                  />
                </div>
              </div>

              <div className="field field-full">
                <label className="lbl" htmlFor="email">Email</label>
                <div className="iw">
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className={`inp${focused === "email" ? " focused" : ""}`}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                  />
                  <span className="ico">✉</span>
                </div>
              </div>

              <div className="field field-full">
                <label className="lbl" htmlFor="password">Password</label>
                <div className="iw">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`inp${focused === "password" ? " focused" : ""}`}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                  />
                  <span
                    className="ico ico-clickable"
                    onClick={() => setShowPassword((value) => !value)}
                    title={showPassword ? "Hide" : "Show"}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </span>
                </div>
              </div>
              </div>

              <button type="button" className="btn">
                <span className="btn-inner">
                  Register
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <p className="bottom-note">
            Already have an account? <a href="/login">Login</a>
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
