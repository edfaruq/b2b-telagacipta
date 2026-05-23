"use client";

import { useEffect, useState } from "react";
import { AdminAccountShell, type AdminMenuKey } from "@/components/admin/AdminAccountShell";
import { CreateProduct } from "@/components/admin/CreateProduct";
import { ManageOrdersPanel } from "@/components/admin/ManageOrdersPanel";
import { ManageProducts } from "@/components/admin/ManageProducts";
import { alertFailBanner } from "@/lib/alertFailBanner";

type UserRow = {
  id_pelanggan: number;
  nama: string;
  instansi: string;
  email: string;
  no_telepon: string;
  alamat: string;
  negara: string;
  status_registrasi: "pending" | "valid" | "rejected";
  tanggal_registrasi: string;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.85); }
  }

  .card-anim {
    animation: fadeInUp 0.38s ease both;
  }

  .card-anim-2 {
    animation: fadeInUp 0.38s 0.1s ease both;
  }

  .card-anim-3 {
    animation: fadeInUp 0.38s 0.2s ease both;
  }

  .overlay-anim {
    animation: fadeIn 0.22s ease both;
  }

  .modal-anim {
    animation: fadeInUp 0.26s ease both;
  }

  .spinning {
    display: inline-block;
    animation: spin 0.9s linear infinite;
  }

  .pending-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #f59e0b;
    animation: pulse-dot 1.4s ease-in-out infinite;
    margin-right: 7px;
  }
`;

/* ── tiny inline SVG icons ── */
const IconUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconRefresh = ({ spinning }: { spinning?: boolean }) => (
  <span className={spinning ? "spinning" : ""} style={{ display: "inline-flex" }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M20 4v6h-6M4 20v-6h6M6.5 9A7 7 0 0119 10M17.5 15A7 7 0 015 14"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </span>
);

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconOrders = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconPackagePlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 11v6M9 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function AdminVerificationsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [isWelcomeHover, setIsWelcomeHover] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>("user-dashboard");
  const processedUsers = users.filter((u) => u.status_registrasi !== "pending");

  const fetchUserData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const [usersRes, pendingRes] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/registrations", { cache: "no-store" }),
      ]);
      const usersResult = (await usersRes.json()) as { users?: UserRow[]; message?: string };
      const pendingResult = (await pendingRes.json()) as { users?: UserRow[]; message?: string };
      if (!usersRes.ok || !pendingRes.ok) {
        setMessage(
          usersResult.message ?? pendingResult.message ?? "Failed to load user data."
        );
        setMessageTone("error");
        setUsers([]);
        setPendingUsers([]);
        return;
      }
      setUsers(usersResult.users ?? []);
      setPendingUsers(pendingResult.users ?? []);
    } catch {
      setMessage("Unable to connect to the server.");
      setMessageTone("error");
      setUsers([]);
      setPendingUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setMessage("");
    if (activeMenu === "user-dashboard") {
      setSelectedUser(null);
      fetchUserData();
    }
  }, [activeMenu]);

  const handleRegistrationAction = async (idPelanggan: number, action: "approve" | "reject") => {
    setMessage("");
    const key = `${action}-${idPelanggan}`;
    setProcessingKey(key);
    try {
      const response = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pelanggan: idPelanggan, action }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(result.message ?? "Failed to update user status.");
        setMessageTone("error");
        return;
      }
      setMessage(result.message ?? "Status updated successfully.");
      setMessageTone("success");
      await fetchUserData();
    } catch {
      setMessage("Unable to connect to the server.");
      setMessageTone("error");
    } finally {
      setProcessingKey(null);
    }
  };

  const adminNavItems = [
    { key: "user-dashboard" as const, label: "Approval Users", icon: <IconUsers /> },
    { key: "create-product" as const, label: "Create Products", icon: <IconPackagePlus /> },
    { key: "manage-product" as const, label: "Manage Products", icon: <IconList /> },
    {
      key: "manage-orders" as const,
      label: "Manage Orders",
      icon: <IconOrders />,
    },
  ];

  return (
    <>
      <style>{styles}</style>
      <AdminAccountShell
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        navItems={adminNavItems}
      >
          {activeMenu === "user-dashboard" ? (
          <>
          {/* Welcome card */}
          <div
            onMouseEnter={() => setIsWelcomeHover(true)}
            onMouseLeave={() => setIsWelcomeHover(false)}
            className="card-anim"
            style={{
              marginBottom: "50px",
              border: "1px solid #d0deff",
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px 18px",
              boxShadow: isWelcomeHover ? "0 12px 24px rgba(10,40,120,0.16)" : "0 4px 18px rgba(10,40,120,0.08)",
              transform: isWelcomeHover ? "translateY(-1px)" : "translateY(0)",
              transition: "all 0.2s ease",
            }}
          >
            <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#051C4A" }}>Welcome Admin!</p>
            <p style={{ margin: "6px 0 0", fontSize: "15px", color: "#6A84B0" }}>
              Manage registered users and pending registration approvals.
            </p>
          </div>

          <h1 style={{ margin: "0 0 4px", fontSize: "32px", color: "#051c4a" }}>Approval Users</h1>
          <p style={{ margin: "7px 0 18px", color: "#6a84b0", fontSize: "17px" }}>
            User list and registration approvals.
          </p>

          {/* Message banner */}
          {message ? (
            <div
              style={{
                margin: "0 0 14px",
                animation: "fadeInUp 0.25s ease both",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                ...(messageTone === "error"
                  ? alertFailBanner
                  : {
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1d4ed8",
                    fontSize: "14px",
                    fontWeight: 500,
                  }),
              }}
            >
              {messageTone === "error" ? (
                <span style={{ display: "inline-flex", flexShrink: 0 }}><IconClose /></span>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              {message}
            </div>
          ) : null}

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px 0", color: "#6A84B0" }}>
              <span className="spinning" style={{ display: "inline-flex" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4v6h-6M4 20v-6h6M6.5 9A7 7 0 0119 10M17.5 15A7 7 0 015 14"
                    stroke="#6A84B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Loading data...
            </div>
          ) : null}

          {/* ── All Users Table ── */}
          <div className="admin-table-card card-anim">
            <div className="admin-table-card__head">
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconUsers />
                All Users
                {processedUsers.length > 0 && (
                  <span className="acct-count-badge">{processedUsers.length}</span>
                )}
              </span>
              <button
                type="button"
                className="acct-btn acct-btn--ghost"
                onClick={() => fetchUserData(true)}
              >
                <IconRefresh spinning={refreshing} />
                Refresh
              </button>
            </div>
            <table className="admin-data-table">
              <colgroup>
                <col className="col-name" />
                <col className="col-inst" />
                <col className="col-email" />
                <col className="col-phone" />
                <col className="col-country" />
                <col className="col-status" />
                <col className="col-date" />
              </colgroup>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Institution</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {processedUsers.map((user) => (
                  <tr key={user.id_pelanggan} className="table-row">
                    <td className="cell-clip" style={{ fontWeight: 500 }} title={user.nama}>{user.nama}</td>
                    <td className="cell-clip" style={{ color: "#4A6490" }} title={user.instansi}>{user.instansi}</td>
                    <td className="cell-clip" style={{ color: "#4A6490" }} title={user.email}>{user.email}</td>
                    <td className="cell-clip" style={{ color: "#4A6490" }}>{user.no_telepon}</td>
                    <td className="cell-clip" style={{ color: "#4A6490" }}>{user.negara}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          borderRadius: "999px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          background:
                            user.status_registrasi === "valid" ? "#ecfdf3"
                            : user.status_registrasi === "rejected" ? "#fef2f2"
                            : "#fffbeb",
                          color:
                            user.status_registrasi === "valid" ? "#166534"
                            : user.status_registrasi === "rejected" ? "#991b1b"
                            : "#92400e",
                          border:
                            user.status_registrasi === "valid" ? "1px solid #bbf7d0"
                            : user.status_registrasi === "rejected" ? "1px solid #fecaca"
                            : "1px solid #fde68a",
                        }}
                      >
                        {user.status_registrasi === "valid" ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : user.status_registrasi === "rejected" ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : null}
                        {user.status_registrasi.toUpperCase()}
                      </span>
                    </td>
                    <td className="cell-clip" style={{ color: "#4A6490", fontSize: "13px" }}>
                      {new Date(user.tanggal_registrasi).toLocaleDateString("en-US")}
                    </td>
                  </tr>
                ))}
                {processedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "24px 14px", color: "#6A84B0", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" opacity="0.35">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#6A84B0" strokeWidth="1.5" strokeLinecap="round"/>
                          <circle cx="9" cy="7" r="4" stroke="#6A84B0" strokeWidth="1.5"/>
                        </svg>
                        No users with valid/rejected status yet.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* ── Pending Approvals Table ── */}
          <div className="admin-table-card card-anim-2">
            <div className="admin-table-card__head">
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconClock />
                Pending Approval Users
                {pendingUsers.length > 0 && (
                  <span className="acct-count-badge acct-count-badge--warn">
                    <span className="pending-dot" />
                    {pendingUsers.length}
                  </span>
                )}
              </span>
              <button
                type="button"
                className="acct-btn acct-btn--ghost"
                onClick={() => fetchUserData(true)}
              >
                <IconRefresh spinning={refreshing} />
                Refresh
              </button>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="admin-table-card__empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" opacity="0.35">
                  <circle cx="12" cy="12" r="10" stroke="#6A84B0" strokeWidth="1.5"/>
                  <path d="M9 12l2 2 4-4" stroke="#6A84B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ margin: 0, fontSize: "14px" }}>No users waiting for approval.</p>
              </div>
            ) : (
              <table className="admin-data-table">
                <colgroup>
                  <col className="col-name" />
                  <col className="col-inst" />
                  <col className="col-email" />
                  <col className="col-country" />
                  <col className="col-actions-wide" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Institution</th>
                    <th>Email Address</th>
                    <th>Country</th>
                    <th className="admin-th-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id_pelanggan} className="table-row">
                      <td className="cell-clip" style={{ fontWeight: 600 }} title={user.nama}>{user.nama}</td>
                      <td className="cell-clip" style={{ color: "#4A6490" }} title={user.instansi}>{user.instansi}</td>
                      <td className="cell-clip" style={{ color: "#4A6490" }} title={user.email}>{user.email}</td>
                      <td className="cell-clip" style={{ color: "#4A6490" }}>{user.negara}</td>
                      <td className="admin-td-actions">
                        <div className="acct-btn-group">
                          <button
                            type="button"
                            className="acct-btn acct-btn--outline"
                            onClick={() => setSelectedUser(user)}
                          >
                            <IconEye />
                            Details
                          </button>
                          <button
                            type="button"
                            className="acct-btn acct-btn--success"
                            onClick={() => handleRegistrationAction(user.id_pelanggan, "approve")}
                            disabled={processingKey === `approve-${user.id_pelanggan}` || processingKey === `reject-${user.id_pelanggan}`}
                          >
                            {processingKey === `approve-${user.id_pelanggan}` ? (
                              <><span className="spinning" style={{ display: "inline-flex" }}><IconRefresh /></span> Approving…</>
                            ) : (
                              <><IconCheck /> Approve</>
                            )}
                          </button>
                          <button
                            type="button"
                            className="acct-btn acct-btn--danger-outline"
                            onClick={() => handleRegistrationAction(user.id_pelanggan, "reject")}
                            disabled={processingKey === `approve-${user.id_pelanggan}` || processingKey === `reject-${user.id_pelanggan}`}
                          >
                            {processingKey === `reject-${user.id_pelanggan}` ? (
                              <><span className="spinning" style={{ display: "inline-flex" }}><IconRefresh /></span> Rejecting…</>
                            ) : (
                              <><IconX /> Reject</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Detail Modal ── */}
          {selectedUser ? (
            <div
              className="overlay-anim"
              onClick={() => setSelectedUser(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(5, 28, 74, 0.40)",
                backdropFilter: "blur(3px)",
                display: "grid",
                placeItems: "center",
                zIndex: 60,
                padding: "16px",
              }}
            >
              <div
                className="modal-anim"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(540px, 100%)",
                  background: "#fff",
                  borderRadius: "16px",
                  border: "1px solid #d0deff",
                  boxShadow: "0 20px 50px rgba(10,40,120,0.22)",
                  overflow: "hidden",
                }}
              >
                {/* Modal header */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid #edf2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f7faff",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#051C4A", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <IconEye />
                    User Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    style={{
                      border: "1px solid #d0deff",
                      borderRadius: "999px",
                      background: "#fff",
                      color: "#6A84B0",
                      cursor: "pointer",
                      display: "inline-flex",
                      padding: "5px",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#fecaca";
                      (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#d0deff";
                      (e.currentTarget as HTMLButtonElement).style.color = "#6A84B0";
                    }}
                  >
                    <IconClose />
                  </button>
                </div>

                {/* Modal body */}
                <div style={{ padding: "18px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    {[
                      { label: "Name", value: selectedUser.nama },
                      { label: "Email Address", value: selectedUser.email },
                      { label: "Institution", value: selectedUser.instansi },
                      { label: "Phone", value: selectedUser.no_telepon },
                      { label: "Country", value: selectedUser.negara },
                      { label: "Registered", value: new Date(selectedUser.tanggal_registrasi).toLocaleString("en-US") },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        style={{
                          background: "#f7faff",
                          border: "1px solid #edf2ff",
                          borderRadius: "8px",
                          padding: "10px 12px",
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "11px", color: "#6A84B0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                          {label}
                        </p>
                        <p style={{ margin: 0, fontSize: "14px", color: "#1A3566", fontWeight: 500 }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Address full width */}
                  <div
                    style={{
                      marginTop: "12px",
                      background: "#f7faff",
                      border: "1px solid #edf2ff",
                      borderRadius: "8px",
                      padding: "10px 12px",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "11px", color: "#6A84B0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      Address
                    </p>
                    <p style={{ margin: 0, fontSize: "14px", color: "#1A3566", fontWeight: 500 }}>{selectedUser.alamat}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          </>
          ) : activeMenu === "manage-orders" ? (
          <ManageOrdersPanel />
          ) : activeMenu === "create-product" ? (
          <CreateProduct />
          ) : (
          <ManageProducts />
          )}
      </AdminAccountShell>
    </>
  );
}