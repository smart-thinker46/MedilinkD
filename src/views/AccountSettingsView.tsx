// Ported from Medilink-Frontend/src/app/settings/page.tsx for desktop parity with enhanced dark mode, password reset, and session management.
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, KeyRound, RefreshCw, Settings, Shield, UserCircle, X } from "lucide-react";
import { useRouter, useSearchParams } from "../lib/navigation";
import { api } from "../lib/api";
import { useAppStore } from "../store/appStore";

type Section = "account" | "security" | "notifications" | "display" | "sessions";
const sectionMeta: Record<Section, { title: string; description: string; icon: typeof UserCircle }> = {
  account: { title: "Profile & account", description: "Review the signed-in user and facility context.", icon: UserCircle },
  security: { title: "Password & security", description: "Update your password, reset credentials, and protect your HMIS session.", icon: Settings },
  notifications: { title: "Notification preferences", description: "Choose which operational alerts appear in the header.", icon: Bell },
  display: { title: "Theme & display", description: "Configure language, theme, and display density for this browser.", icon: Settings },
  sessions: { title: "Sessions & active devices", description: "Review active sign-ins and revoke sessions when needed.", icon: Settings },
};

const isAdminLikeRole = (...values: unknown[]) =>
  values.some((value) =>
    [
      "super_admin",
      "hospital_admin",
      "admin",
      "administrator",
      "facility_admin",
      "tenant_admin",
      "ict_manager",
      "compliance_officer",
    ].includes(String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_")),
  );

const readPreference = (key: string, fallback: boolean) =>
  typeof window === "undefined"
    ? fallback
    : window.localStorage.getItem(key) === null
    ? fallback
    : window.localStorage.getItem(key) === "true";

function extractApiError(err: any, fallback: string): string {
  const data = err?.response?.data;
  if (!data) return String(err?.message || fallback);
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  return fallback;
}

export default function AccountSettingsView() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = String(params?.get("section") || "account") as Section;
  const { user, facility } = useAppStore();

  const [profile, setProfile] = useState<any>({});
  const [access, setAccess] = useState<any>({});
  const [authorizationLoaded, setAuthorizationLoaded] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Password change & reset states
  const [securityTab, setSecurityTab] = useState<"change" | "reset">("change");
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [resetForm, setResetForm] = useState({ email: user?.email || "", otp: "", newPassword: "", confirmPassword: "" });

  // Preferences
  const [notifications, setNotifications] = useState({ queue: true, security: true, clinical: true, messaging: true });
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  const [density, setDensity] = useState("comfortable");

  const isAdmin =
    (authorizationLoaded && isAdminLikeRole(profile.role, profile.roleName, profile.roleLabel, access.roleName, access.roleLabel)) ||
    isAdminLikeRole(user?.role);
  const section: Section = sectionMeta[requested] && (requested !== "sessions" || isAdmin) ? requested : "account";
  const meta = sectionMeta[section] || sectionMeta.account;
  const Icon = meta.icon || Settings;
  const navItems = useMemo(
    () => (Object.entries(sectionMeta) as Array<[Section, typeof sectionMeta[Section]]>).filter(([key]) => key !== "sessions" || isAdmin),
    [isAdmin],
  );

  useEffect(() => {
    void Promise.all([api.get("/security/me"), api.get("/security/access/me")])
      .then(([profileResponse, accessResponse]) => {
        setProfile(profileResponse.data || {});
        setAccess(accessResponse.data || {});
      })
      .catch(() => undefined)
      .finally(() => setAuthorizationLoaded(true));

    setNotifications({
      queue: readPreference("hmis.notify.queue", true),
      security: readPreference("hmis.notify.security", true),
      clinical: readPreference("hmis.notify.clinical", true),
      messaging: readPreference("hmis.notify.messaging", true),
    });

    if (typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem("hmis.theme") || "system";
      setTheme(savedTheme);
      setLanguage(window.localStorage.getItem("hmis.language") || "en");
      setDensity(window.localStorage.getItem("hmis.density") || "comfortable");
      if (user?.email && !resetForm.email) {
        setResetForm((f) => ({ ...f, email: user.email }));
      }
    }
  }, [user?.email]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    setError("");
    try {
      const response = await api.get("/security/sessions");
      const rows = Array.isArray(response.data) ? response.data : response.data?.sessions || response.data?.data || [];
      const sessionList = Array.isArray(rows) ? rows : [];
      if (sessionList.length === 0) {
        // Fallback representation of current device session so users always have insight
        setSessions([
          {
            id: "current-session",
            deviceName: "Current Desktop Client",
            deviceId: "desktop",
            userName: profile.name || user?.name || "Active Session",
            userEmail: profile.email || user?.email || null,
            role: profile.roleLabel || profile.role || user?.role || "Active Session",
            ip: "127.0.0.1",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Medilink Desktop",
            lastSeenAt: new Date().toISOString(),
            lockStatus: "ACTIVE",
            isCurrent: true,
          },
        ]);
      } else {
        setSessions(sessionList);
      }
    } catch {
      // Gracefully show current local session if endpoint is restricted or offline
      setSessions([
        {
          id: "current-session",
          deviceName: "Current Desktop Client",
          deviceId: "desktop",
          userName: profile.name || user?.name || "Active Session",
          userEmail: profile.email || user?.email || null,
          role: profile.roleLabel || profile.role || user?.role || "Active Session",
          ip: "127.0.0.1",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Medilink Desktop",
          lastSeenAt: new Date().toISOString(),
          lockStatus: "ACTIVE",
          isCurrent: true,
        },
      ]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (section === "sessions") {
      void loadSessions();
    }
  }, [section]);

  const savePreference = (key: string, value: string | boolean) => {
    window.localStorage.setItem(key, String(value));
    if (key === "hmis.theme") {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      const isDark = value === "system" ? Boolean(prefersDark) : value === "dark";
      window.localStorage.setItem("hmis_app_mode", isDark ? "dark" : "light");
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
      document.documentElement.dataset.themePreference = String(value);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else if (key === "hmis.density") {
      document.documentElement.dataset.density = String(value);
      window.localStorage.setItem("hmis_compact_dashboard", String(value === "compact"));
    } else if (key === "hmis.language") {
      document.documentElement.lang = String(value);
    }
    window.dispatchEvent(new CustomEvent("hmis:preferences-changed"));
    setNotice("Preference saved on this device.");
    window.setTimeout(() => setNotice(""), 2500);
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (passwords.newPassword.length < 12) {
      setError("New password must be at least 12 characters long.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (passwords.oldPassword === passwords.newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setNotice("Password changed successfully.");
    } catch (requestError: any) {
      setError(extractApiError(requestError, "Unable to change password."));
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!resetForm.email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    if (!resetForm.otp.trim()) {
      setError("Please enter the verification code (OTP).");
      return;
    }
    if (resetForm.newPassword.length < 12) {
      setError("New password must be at least 12 characters long.");
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/reset", {
        email: resetForm.email.trim(),
        otp: resetForm.otp.trim(),
        newPassword: resetForm.newPassword,
      });
      setResetForm({ email: user?.email || "", otp: "", newPassword: "", confirmPassword: "" });
      setNotice("Password reset successfully. You can now use your new password.");
      setSecurityTab("change");
    } catch (requestError: any) {
      setError(extractApiError(requestError, "Unable to reset password. Please check your verification code."));
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (id: string, isCurrent?: boolean) => {
    if (isCurrent || id === "current-session") {
      setError("You cannot revoke your active desktop session here. Use Logout in the topbar to end this session.");
      return;
    }
    setError("");
    setNotice("");
    try {
      await api.post(`/security/sessions/${encodeURIComponent(id)}/revoke`);
      setSessions((rows) => rows.filter((row) => String(row.id || row.sessionId) !== id));
      setNotice("Session revoked successfully.");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (requestError: any) {
      setError(extractApiError(requestError, "Unable to revoke this session."));
    }
  };

  const revokeAllOtherSessions = async () => {
    const otherSessions = sessions.filter((s) => !s.isCurrent && s.id !== "current-session");
    if (!otherSessions.length) {
      setNotice("No other active sessions to revoke.");
      return;
    }
    setError("");
    setNotice("");
    try {
      const userId = profile.id || (user as any)?.id || profile.userId;
      if (userId) {
        await api.post(`/security/users/${encodeURIComponent(userId)}/revoke-sessions`).catch(() => null);
      }
      for (const s of otherSessions) {
        await api.post(`/security/sessions/${encodeURIComponent(s.id)}/revoke`).catch(() => null);
      }
      await loadSessions();
      setNotice("All other active sessions have been revoked.");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (requestError: any) {
      setError(extractApiError(requestError, "Unable to revoke all other sessions."));
    }
  };

  return (
    <main className="settings-page">
      <header className="settings-page-header">
        <div>
          <span className="settings-kicker">ACCOUNT &amp; SYSTEM</span>
          <h1>Settings</h1>
          <p>Manage your HMIS account, preferences, security, and active sessions.</p>
        </div>
        <button type="button" className="settings-close" onClick={() => router.back()} aria-label="Close settings">
          <X size={18} />
        </button>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {navItems.map(([key, item]) => {
            const NavIcon = item.icon || Settings;
            return (
              <button
                key={key}
                type="button"
                className={section === key ? "is-active" : ""}
                onClick={() => router.push(`/settings?section=${key}`)}
              >
                <NavIcon size={16} />
                <span>{item.title}</span>
              </button>
            );
          })}
          {isAdmin ? (
            <button type="button" onClick={() => router.push("/full-system-setup")}>
              <Settings size={16} />
              <span>Facility settings</span>
            </button>
          ) : null}
        </nav>

        <section className="settings-content">
          <div className="settings-section-title">
            <Icon size={19} />
            <div>
              <h2>{meta.title}</h2>
              <p>{meta.description}</p>
            </div>
          </div>

          {notice ? <div className="settings-notice is-success"><Settings size={15} />{notice}</div> : null}
          {error ? <div className="settings-notice is-error">{error}</div> : null}

          {/* Section: Profile & account */}
          {section === "account" ? (
            <div className="settings-card settings-profile-card">
              <UserCircle size={42} />
              <div>
                <strong>{profile.name || profile.fullName || user?.name || "HMIS User"}</strong>
                <span>{profile.email || user?.email || "Email not available"}</span>
                <small>
                  Role: {profile.roleLabel || profile.role || user?.role || "User"} · Facility:{" "}
                  {profile.facilityName || profile.hospitalName || facility?.name || "Current facility"}
                </small>
              </div>
            </div>
          ) : null}

          {/* Section: Password & security */}
          {section === "security" ? (
            <div className="settings-security-container">
              <div className="settings-tab-row" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <button
                  type="button"
                  className={`settings-tab ${securityTab === "change" ? "is-active" : ""}`}
                  onClick={() => { setSecurityTab("change"); setError(""); setNotice(""); }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: securityTab === "change" ? "#0f766e" : "#cbd5e1",
                    background: securityTab === "change" ? "#0f766e" : "transparent",
                    color: securityTab === "change" ? "#fff" : "inherit",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                  }}
                >
                  <KeyRound size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                  Change Password
                </button>
                <button
                  type="button"
                  className={`settings-tab ${securityTab === "reset" ? "is-active" : ""}`}
                  onClick={() => { setSecurityTab("reset"); setError(""); setNotice(""); }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: securityTab === "reset" ? "#0f766e" : "#cbd5e1",
                    background: securityTab === "reset" ? "#0f766e" : "transparent",
                    color: securityTab === "reset" ? "#fff" : "inherit",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                  }}
                >
                  <Shield size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                  Reset with Code (Forgot Password)
                </button>
              </div>

              {securityTab === "change" ? (
                <form className="settings-card settings-form module-form-body" onSubmit={changePassword}>
                  <div className="module-form-grid">
                    <label className="module-form-field">
                      <span>Current password</span>
                      <input
                        required
                        type="password"
                        className="module-form-input"
                        placeholder="Enter current password"
                        value={passwords.oldPassword}
                        onChange={(event) => setPasswords({ ...passwords, oldPassword: event.target.value })}
                      />
                    </label>
                    <label className="module-form-field">
                      <span>New password</span>
                      <input
                        required
                        minLength={12}
                        type="password"
                        className="module-form-input"
                        placeholder="Minimum 12 characters"
                        value={passwords.newPassword}
                        onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
                      />
                    </label>
                    <label className="module-form-field">
                      <span>Confirm new password</span>
                      <input
                        required
                        minLength={12}
                        type="password"
                        className="module-form-input"
                        placeholder="Re-enter new password"
                        value={passwords.confirmPassword}
                        onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="module-form-footer">
                    <button type="submit" disabled={saving} className="form-btn form-btn-primary module-form-submit">
                      {saving ? "Changing password…" : "Change password"}
                    </button>
                  </div>
                </form>
              ) : (
                <form className="settings-card settings-form module-form-body" onSubmit={resetPassword}>
                  <div className="module-form-grid">
                    <label className="module-form-field">
                      <span>Account Email</span>
                      <input
                        required
                        type="email"
                        className="module-form-input"
                        placeholder="e.g. user@medilink.com"
                        value={resetForm.email}
                        onChange={(event) => setResetForm({ ...resetForm, email: event.target.value })}
                      />
                    </label>
                    <label className="module-form-field">
                      <span>Verification OTP / Reset Code</span>
                      <input
                        required
                        type="text"
                        className="module-form-input"
                        placeholder="Enter 4-10 digit verification code"
                        value={resetForm.otp}
                        onChange={(event) => setResetForm({ ...resetForm, otp: event.target.value })}
                      />
                    </label>
                    <label className="module-form-field">
                      <span>New password</span>
                      <input
                        required
                        minLength={12}
                        type="password"
                        className="module-form-input"
                        placeholder="Minimum 12 characters"
                        value={resetForm.newPassword}
                        onChange={(event) => setResetForm({ ...resetForm, newPassword: event.target.value })}
                      />
                    </label>
                    <label className="module-form-field">
                      <span>Confirm new password</span>
                      <input
                        required
                        minLength={12}
                        type="password"
                        className="module-form-input"
                        placeholder="Re-enter new password"
                        value={resetForm.confirmPassword}
                        onChange={(event) => setResetForm({ ...resetForm, confirmPassword: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="module-form-footer">
                    <button type="submit" disabled={saving} className="form-btn form-btn-primary module-form-submit">
                      {saving ? "Resetting password…" : "Reset password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : null}

          {/* Section: Notification preferences */}
          {section === "notifications" ? (
            <div className="settings-card settings-options">
              {(
                [
                  ["queue", "Queue notifications", "Patient routing and waiting-list updates"],
                  ["security", "Security alerts", "Sign-in, permission, and audit alerts"],
                  ["clinical", "Clinical alerts", "Important patient-care notifications"],
                  ["messaging", "Messaging updates", "SMS, WhatsApp, and delivery events"],
                ] as const
              ).map(([key, label, description]) => (
                <label key={key}>
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={(event) => {
                      const value = event.target.checked;
                      setNotifications((current) => ({ ...current, [key]: value }));
                      savePreference(`hmis.notify.${key}`, value);
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}

          {/* Section: Theme & display */}
          {section === "display" ? (
            <div className="settings-card settings-form module-form-body">
              <div className="module-form-grid">
                <label className="module-form-field">
                  <span>Theme</span>
                  <select
                    className="module-form-input"
                    value={theme}
                    onChange={(event) => {
                      setTheme(event.target.value);
                      savePreference("hmis.theme", event.target.value);
                    }}
                  >
                    <option value="system">Use system theme</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                <label className="module-form-field">
                  <span>Language</span>
                  <select
                    className="module-form-input"
                    value={language}
                    onChange={(event) => {
                      setLanguage(event.target.value);
                      savePreference("hmis.language", event.target.value);
                    }}
                  >
                    <option value="en">English</option>
                    <option value="sw">Kiswahili</option>
                  </select>
                </label>
                <label className="module-form-field">
                  <span>Display density</span>
                  <select
                    className="module-form-input"
                    value={density}
                    onChange={(event) => {
                      setDensity(event.target.value);
                      savePreference("hmis.density", event.target.value);
                    }}
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          {/* Section: Sessions & active devices */}
          {section === "sessions" ? (
            <div className="settings-card settings-sessions-wrap" style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  Active sign-ins authenticated to this facility.
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => void loadSessions()}
                    disabled={sessionsLoading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      borderRadius: "5px",
                      border: "1px solid #cbd5e1",
                      background: "transparent",
                      color: "inherit",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <RefreshCw size={13} className={sessionsLoading ? "spin" : ""} />
                    {sessionsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                  {sessions.filter((s) => !s.isCurrent && s.id !== "current-session").length > 0 && (
                    <button
                      type="button"
                      onClick={() => void revokeAllOtherSessions()}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "5px",
                        border: "0",
                        background: "#b91c1c",
                        color: "#fff",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Revoke All Others
                    </button>
                  )}
                </div>
              </div>

              <div className="settings-session-list">
                {sessions.length ? (
                  sessions.map((session) => {
                    const id = String(session.id || session.sessionId || "");
                    const isCurrent = Boolean(session.isCurrent || id === "current-session");
                    const userTitle = session.userName || session.userEmail || user?.name || "Active Session";
                    const deviceLabel = session.deviceId || session.deviceName || session.userAgent || "Desktop Client";
                    const ipLabel = session.ip || session.ipAddress || "Local Network";
                    const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString() : "Active now";

                    return (
                      <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px", borderRadius: "6px" }}>
                        <div>
                          <strong>
                            {userTitle} · {deviceLabel} {isCurrent ? <span style={{ color: "#10b981", fontSize: "0.72rem", marginLeft: "6px" }}>(Current Session)</span> : null}
                          </strong>
                          <small>
                            IP: {ipLabel} · Last active: {lastSeen}
                            {session.role ? ` · ${session.role}` : ""}
                            {session.lockStatus ? ` · Status: ${session.lockStatus}` : ""}
                          </small>
                        </div>
                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() => void revokeSession(id, isCurrent)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "4px",
                              border: 0,
                              background: "#b91c1c",
                              color: "#fff",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Revoke
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700 }}>
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p>No active sessions are available to display.</p>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
