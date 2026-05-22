"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeReturnPath } from "@/lib/safe-return-path";
import { COUNTRIES } from "@/data/countries";
import { buildFullPhone, getCountryDialCode } from "@/data/country-dial-codes";

type AlertTone = "success" | "warning" | "error";
type AlertItem = { id: string; tone: AlertTone; text: string };

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("returnTo"), "/");
  const loginHref =
    returnTo === "/"
      ? "/login"
      : `/login?returnTo=${encodeURIComponent(returnTo)}`;
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focused, setFocused] = useState("");
  const [form, setForm] = useState({
    nama: "",
    instansi: "",
    no_telepon: "",
    negara: "",
    alamat: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const countryMenuRef = useRef<HTMLDivElement | null>(null);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const hasCountry = (COUNTRIES as readonly string[]).includes(form.negara);
  const dialCode = hasCountry ? getCountryDialCode(form.negara) : "";
  const maxLocalDigits = hasCountry ? Math.max(1, 15 - dialCode.length) : 15;

  const selectCountry = (country: string) => {
    setField("negara", country);
    setCountryQuery(country);
    setIsCountryOpen(false);
  };

  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(countryQuery.trim().toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (!countryMenuRef.current) return;
      if (countryMenuRef.current.contains(event.target as Node)) return;
      setIsCountryOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRegister = async () => {
    if (isSubmitting) return;
    setAlerts([]);

    if (form.password !== confirmPassword) {
      setAlerts([
        {
          id: "password-mismatch",
          tone: "error",
          text: "Confirm password does not match password.",
        },
      ]);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPhone = hasCountry
        ? buildFullPhone(dialCode, form.no_telepon)
        : form.no_telepon.trim();
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, no_telepon: fullPhone }),
      });
      const result = (await response.json()) as { message?: string; errors?: string[] };
      if (!response.ok) {
        const errorMessages = result.errors?.length ? result.errors : [result.message ?? "Registration failed. Please try again."];
        setAlerts(errorMessages.map((text, index) => ({ id: `server-${index}-${text}`, tone: "error", text })));
        return;
      }

      setAlerts([
        {
          id: "register-success",
          tone: "success",
          text: result.message ?? "Registration successful. Redirecting to login...",
        },
      ]);
      window.setTimeout(() => router.push(loginHref), 800);
    } catch {
      setAlerts([{ id: "register-network", tone: "error", text: "Unable to connect to the server." }]);
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

        .card {
          width: 100%;
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid rgba(100,150,255,0.1);
          box-shadow: 0 4px 32px rgba(10,40,120,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
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
        .sep { height: 1px; background: #EDF2FF; margin-bottom: 24px; }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .field { margin-bottom: 16px; }
        .field-full { grid-column: 1 / -1; }
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
        .inp-area {
          resize: vertical;
          min-height: 108px;
          padding-right: 16px;
        }
        .ico {
          position: absolute;
          right: 15px; top: 50%;
          transform: translateY(-50%);
          color: #9CB4D8;
          font-size: 16px;
          user-select: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ico-clickable { cursor: pointer; transition: color 0.15s; }
        .ico-clickable:hover { color: #1565D8; }
        .pass-toggle-logo {
          width: 18px;
          height: 18px;
          object-fit: contain;
          opacity: 0.88;
        }
        .country-trigger {
          position: relative;
        }
        .country-input {
          width: 100%;
          border: 1.5px solid #D0DEFF;
          border-radius: 12px;
          padding: 14px 48px 14px 16px;
          font-size: 15px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #051C4A;
          background: #F7FAFF;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .country-input:hover {
          border-color: #8EB0FF;
          background: #fff;
        }
        .country-input:focus {
          border-color: #1565D8;
          background: #fff;
          box-shadow: 0 0 0 3.5px rgba(21,101,216,0.11);
        }
        .country-trigger-icon {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #7c96c2;
          font-size: 17px;
          pointer-events: auto;
          cursor: pointer;
        }
        .country-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #d0deff;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 12px 24px rgba(7, 33, 81, 0.12);
          z-index: 20;
          padding: 5px;
        }
        .country-option {
          width: 100%;
          border: 0;
          background: transparent;
          text-align: left;
          padding: 10px 12px;
          border-radius: 8px;
          color: #294579;
          font-size: 14px;
          cursor: pointer;
        }
        .country-option:hover {
          background: #eef4ff;
        }
        .phone-wrap {
          display: flex;
          align-items: stretch;
          border: 1.5px solid #D0DEFF;
          border-radius: 12px;
          background: #F7FAFF;
          overflow: hidden;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .phone-wrap:hover {
          border-color: #8EB0FF;
          background: #fff;
        }
        .phone-wrap.focused {
          border-color: #1565D8;
          background: #fff;
          box-shadow: 0 0 0 3.5px rgba(21,101,216,0.11);
        }
        .phone-prefix {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          padding: 0 14px;
          font-size: 15px;
          font-weight: 600;
          color: #1A3566;
          background: #EEF4FF;
          border-right: 1.5px solid #D0DEFF;
          user-select: none;
        }
        .phone-inp {
          flex: 1;
          min-width: 0;
          border: none;
          border-radius: 0;
          padding: 14px 16px;
          background: transparent;
          box-shadow: none;
        }
        .phone-inp:hover,
        .phone-inp.focused {
          border: none;
          box-shadow: none;
          background: transparent;
        }

        .btn {
          width: 100%;
          margin-top: 8px;
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
          will-change: transform, opacity;
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
        @media (max-width: 700px) {
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="root">
        <div className="bg-blob-bottom" />

        <div className="wrap">
          {alerts.length > 0 ? (
            <div style={{ width: "100%", display: "grid", gap: "10px", marginBottom: "8px" }}>
              {alerts.map((alert) => (
                <div key={alert.id} className={`top-alert ${alert.tone}`}>
                  {alert.text}
                </div>
              ))}
            </div>
          ) : null}
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
                    required
                    maxLength={60}
                    value={form.nama}
                    onChange={(event) => setField("nama", event.target.value)}
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
                    required
                    maxLength={50}
                    value={form.instansi}
                    onChange={(event) => setField("instansi", event.target.value)}
                    onFocus={() => setFocused("instansi")}
                    onBlur={() => setFocused("")}
                  />
                </div>
              </div>

              <div className="field">
                <label className="lbl" htmlFor="negara">Country</label>
                <div className="iw" ref={countryMenuRef}>
                  <div id="negara" className="country-trigger">
                    <input
                      type="text"
                      className="country-input"
                      value={countryQuery}
                      placeholder="Select country..."
                      onFocus={() => setIsCountryOpen(true)}
                      onChange={(event) => {
                        setCountryQuery(event.target.value);
                        setField("negara", event.target.value);
                        if (!isCountryOpen) setIsCountryOpen(true);
                      }}
                    />
                    <span
                      className="country-trigger-icon"
                      onClick={() => setIsCountryOpen((current) => !current)}
                    >
                      ▾
                    </span>
                  </div>
                  {isCountryOpen ? (
                    <div className="country-menu">
                      {filteredCountries.map((country) => (
                        <button
                          key={country}
                          type="button"
                          className="country-option"
                          onClick={() => selectCountry(country)}
                        >
                          {country}
                        </button>
                      ))}
                      {filteredCountries.length === 0 ? (
                        <div className="country-option" style={{ color: "#8aa0c7", cursor: "default" }}>
                          No country found
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="field">
                <label className="lbl" htmlFor="telp">Phone Number</label>
                <div className="iw">
                  {hasCountry ? (
                    <div className={`phone-wrap${focused === "telp" ? " focused" : ""}`}>
                      <span className="phone-prefix" aria-hidden="true">
                        +{dialCode}
                      </span>
                      <input
                        id="telp"
                        type="text"
                        inputMode="numeric"
                        placeholder={dialCode === "62" ? "812xxxxxxxx" : "Phone number"}
                        className="inp phone-inp"
                        required
                        maxLength={maxLocalDigits}
                        value={form.no_telepon}
                        onChange={(event) =>
                          setField("no_telepon", event.target.value.replace(/[^\d]/g, "").slice(0, maxLocalDigits))
                        }
                        onFocus={() => setFocused("telp")}
                        onBlur={() => setFocused("")}
                      />
                    </div>
                  ) : (
                    <input
                      id="telp"
                      type="text"
                      className="inp"
                      disabled
                      placeholder="Select country first"
                    />
                  )}
                </div>
              </div>

              <div className="field field-full">
                <label className="lbl" htmlFor="alamat">Address</label>
                <div className="iw">
                  <textarea
                    id="alamat"
                    placeholder="Enter full address"
                    className={`inp inp-area${focused === "alamat" ? " focused" : ""}`}
                    required
                    maxLength={255}
                    value={form.alamat}
                    onChange={(event) => setField("alamat", event.target.value)}
                    onFocus={() => setFocused("alamat")}
                    onBlur={() => setFocused("")}
                  />
                </div>
              </div>

              <div className="field field-full">
                <label className="lbl" htmlFor="email">Email Address</label>
                <div className="iw">
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className={`inp${focused === "email" ? " focused" : ""}`}
                    required
                    maxLength={50}
                    value={form.email}
                    onChange={(event) => setField("email", event.target.value)}
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
                    placeholder="Min 8 Chars, uppercase, lowercase, special character"
                    className={`inp${focused === "password" ? " focused" : ""}`}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(event) => setField("password", event.target.value)}
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

              <div className="field field-full">
                <label className="lbl" htmlFor="confirm-password">Confirm Password</label>
                <div className="iw">
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    className={`inp${focused === "confirm-password" ? " focused" : ""}`}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onFocus={() => setFocused("confirm-password")}
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

              <button type="button" className="btn" onClick={handleRegister} disabled={isSubmitting}>
                <span className="btn-inner">
                  {isSubmitting ? "Registering..." : "Register"}
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <p className="bottom-note">
            Already have an account? <a href={loginHref}>Login</a>
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
