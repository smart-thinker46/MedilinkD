import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  Clock,
  LogOut,
  Settings,
  Search,
  X,
} from "lucide-react";

type ModuleSearchResult = {
  id: number;
  name: string;
  iconType?: string;
  premium?: boolean;
};

type DesktopTopbarProps = {
  activeNav: number;
  onGoBack: () => void;
  onOpenSettings: () => void;
  userName?: string;
  userRole?: string;
  onLogout: () => void;
  queueNotices?: any[];
  // Module search props
  moduleSearch?: string;
  onModuleSearchChange?: (value: string) => void;
  moduleSearchFocused?: boolean;
  onModuleSearchFocus?: () => void;
  onModuleSearchBlur?: () => void;
  moduleSearchResults?: ModuleSearchResult[];
  onModuleSearchSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onOpenModule?: (id: number) => void;
};

export function DesktopTopbar({
  activeNav,
  onGoBack,
  onOpenSettings,
  userName = "Hospital Admin",
  userRole = "Hospital Admin",
  onLogout,
  queueNotices = [],
  moduleSearch = "",
  onModuleSearchChange,
  moduleSearchFocused = false,
  onModuleSearchFocus,
  onModuleSearchBlur,
  moduleSearchResults = [],
  onModuleSearchSubmit,
  onOpenModule,
}: DesktopTopbarProps) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
      setDateStr(
        now.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const userInitial = String(userName || "U").trim().slice(0, 1).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {activeNav !== 0 && (
          <button
            type="button"
            className="topbar-back-btn"
            onClick={onGoBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: "0.78rem",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}

        {/* Digital clock */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "0.76rem",
            fontWeight: 700,
            padding: "4px 8px",
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: 6,
          }}
        >
          <Clock size={13} style={{ color: "var(--hmis-primary, #13d802)" }} />
          <span>{timeStr}</span>
          <span style={{ opacity: 0.6 }}>· {dateStr}</span>
        </div>

        {/* Module Search */}
        {onModuleSearchChange && (
          <form
            className={`search-wrap ${moduleSearch.trim() ? "has-value" : "is-empty"}`}
            onSubmit={onModuleSearchSubmit}
            style={{ position: "relative", marginLeft: 8 }}
          >
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.7)",
                pointerEvents: "none",
              }}
            />
            <input
              className="search-input"
              type="text"
              placeholder="Search modules..."
              aria-label="Search modules"
              value={moduleSearch}
              onChange={(e) => onModuleSearchChange(e.target.value)}
              onFocus={onModuleSearchFocus}
              onBlur={onModuleSearchBlur}
            />
            {moduleSearchFocused && moduleSearch.trim() && (
              <div className="module-search-panel">
                {moduleSearchResults.length > 0 ? (
                  moduleSearchResults.map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      className="module-search-result"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onOpenModule?.(mod.id)}
                    >
                      <span>
                        <strong>{mod.name}</strong>
                        <small>{mod.premium ? "Premium module" : "Core module"}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="module-search-empty">No module found.</p>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Settings button */}
        <button
          type="button"
          className="topbar-icon-btn"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>

        {/* Notifications toggle */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {queueNotices.length > 0 && (
              <span className="topbar-alert-count">{queueNotices.length}</span>
            )}
          </button>

          {/* Notifications dropdown panel */}
          {notificationsOpen && (
            <div
              className="topbar-popover custom-scrollbar"
              style={{
                position: "absolute",
                right: 0,
                top: 42,
                width: 320,
                maxHeight: 400,
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: 10,
                boxShadow: "0 14px 38px rgba(0, 0, 0, 0.22)",
                zIndex: 999,
                overflowY: "auto",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderBottom: "1px solid #f1f5f9",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                }}
              >
                <span>Live Notices ({queueNotices.length})</span>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ padding: "8px 12px" }}>
                {queueNotices.length === 0 ? (
                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "12px 0", textAlign: "center" }}>
                    No pending alerts or queue notifications.
                  </p>
                ) : (
                  queueNotices.map((notice, idx) => (
                    <div
                      key={notice.id || idx}
                      style={{
                        padding: "8px 0",
                        borderBottom: idx < queueNotices.length - 1 ? "1px solid #f8fafc" : "none",
                        fontSize: "0.78rem",
                      }}
                    >
                      <strong style={{ display: "block", color: "#1e293b" }}>
                        {notice.token ? `Token #${notice.token} - ` : ""}
                        {notice.patientName || "Patient"}
                      </strong>
                      <span style={{ color: "#64748b" }}>
                        {notice.moduleLabel || "Queue"} · {notice.status || "WAITING"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar & menu */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: 20,
              padding: "3px 10px 3px 4px",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--hmis-primary, #13d802)",
                color: "#0f172a",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
              }}
            >
              {userInitial}
            </div>
            <span style={{ fontSize: "0.76rem", fontWeight: 700 }}>{userName}</span>
          </button>

          {profileOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 42,
                width: 220,
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: 10,
                boxShadow: "0 14px 38px rgba(0, 0, 0, 0.22)",
                zIndex: 999,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
                <strong style={{ display: "block", fontSize: "0.82rem", color: "#0f172a" }}>
                  {userName}
                </strong>
                <small style={{ color: "#64748b", fontSize: "0.72rem" }}>{userRole}</small>
              </div>
              <div style={{ padding: "6px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenSettings();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 10px",
                    background: "none",
                    border: "none",
                    borderRadius: 6,
                    color: "#334155",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Settings size={14} /> System Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setLogoutConfirm(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 10px",
                    background: "none",
                    border: "none",
                    borderRadius: 6,
                    color: "#dc2626",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout confirmation modal */}
      {logoutConfirm && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: 12,
              padding: 24,
              maxWidth: 380,
              width: "90%",
              boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: 8 }}>
              Confirm Sign Out
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: 20 }}>
              Are you sure you want to log out of your session? Unsaved form progress may be lost.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setLogoutConfirm(false)}
                className="btn-cancel"
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirm(false);
                  onLogout();
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

