import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BrainCircuit,
  LogOut,
  Settings,
  UserCircle,
  X,
} from "lucide-react";
import { MODULE_CATALOG } from "../../lib/moduleCatalog";
import { getModuleIcon } from "../../lib/moduleIconMap";
import { apiFetch } from "../../lib/apiClient";
import { useAppStore } from "../../store/appStore";

type QueueNotice = {
  id: string;
  patientName: string;
  token: string;
  status: string;
  moduleLabel: string;
  priority?: string;
};

type HeaderNotification = QueueNotice & {
  category: "queue";
  severity: "critical" | "warning" | "info";
};

type DesktopTopbarProps = {
  activeNav: number;
  activeWorkflowModuleId: number | null;
  onGoBack: () => void;
  onOpenSettings: (section?: string) => void;
  onOpenHelpAi: () => void;
  onOpenFacilitySettings: () => void;
  onOpenHelpdesk: () => void;
  onNavigateQueue: () => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  facilityId?: string;
  facilityName?: string;
  facilityLogo?: string | null;
  allowedModuleIds?: Set<number>;
  onOpenModule: (id: number) => void;
};

const DEFAULT_USER_NAMES = new Set(["dr. almalick", "hospital admin", "user"]);

const cleanDisplayName = (...values: Array<unknown>) => {
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text || DEFAULT_USER_NAMES.has(text.toLowerCase())) continue;
    return text;
  }
  const fallback = String(values.find((value) => String(value || "").trim()) || "").trim();
  return fallback || "Hospital Admin";
};

const isFacilityLevelLabel = (value?: unknown) =>
  /^level\s+\d\b/i.test(String(value || "").trim());

const pickHospitalName = (...values: Array<unknown>) => {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text && !isFacilityLevelLabel(text)) return text;
  }
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
};

const isAdminLikeRole = (...values: Array<unknown>) =>
  values.some((value) => {
    const role = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    return [
      "super_admin",
      "hospital_admin",
      "admin",
      "administrator",
      "facility_admin",
      "tenant_admin",
    ].includes(role);
  });

const normalizeStatus = (value: unknown) =>
  String(value || "").trim().toUpperCase().replace(/\s+/g, "_");

const normalizeQueueRows = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.board)) return data.board;
  if (Array.isArray(data?.tokens)) return data.tokens;
  return [];
};

export function DesktopTopbar({
  activeNav,
  activeWorkflowModuleId,
  onGoBack,
  onOpenSettings,
  onOpenHelpAi,
  onOpenFacilitySettings,
  onOpenHelpdesk,
  onNavigateQueue,
  onLogout,
  userName = "Hospital Admin",
  userRole = "Hospital Admin",
  userEmail = "admin@medilink.com",
  facilityId = "facility",
  facilityName = "Hospital Facility",
  facilityLogo = null,
  allowedModuleIds = new Set<number>(),
  onOpenModule,
}: DesktopTopbarProps) {
  const { patients } = useAppStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Search state
  const [moduleSearch, setModuleSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Notifications state
  const [queueNotices, setQueueNotices] = useState<QueueNotice[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  const showBack = activeNav !== 0 || activeWorkflowModuleId !== null;
  const isAdmin = isAdminLikeRole(userRole);

  // Filter modules based on query and RBAC
  const moduleSearchResults = useMemo(() => {
    const query = moduleSearch.trim().toLowerCase();
    if (!query) return [];
    return MODULE_CATALOG.filter((module) => {
      if (!isAdmin && allowedModuleIds && allowedModuleIds.size > 0 && !allowedModuleIds.has(module.id)) {
        return false;
      }
      const haystack = `${module.name} ${module.layer} ${module.path}`.toLowerCase();
      return haystack.includes(query);
    }).slice(0, 8);
  }, [moduleSearch, isAdmin, allowedModuleIds]);

  // Notifications list
  const notifications = useMemo<HeaderNotification[]>(() => {
    return queueNotices.map((notice) => {
      const priority = normalizeStatus(notice.priority);
      return {
        ...notice,
        category: "queue",
        severity:
          priority.includes("CRITICAL") || priority.includes("EMERGENCY")
            ? "critical"
            : priority.includes("URGENT") || priority.includes("HIGH")
            ? "warning"
            : "info",
      };
    });
  }, [queueNotices]);

  const visibleNotifications = notifications.filter(
    (n) => !dismissedNotificationIds.includes(n.id)
  );
  const unreadNotificationCount = visibleNotifications.filter(
    (n) => !readNotificationIds.includes(n.id)
  ).length;

  const buildFallbackQueue = useCallback(() => {
    return patients
      .slice(0, 8)
      .map((patient) => ({
        id: patient.id,
        patientName: patient.name,
        token: patient.regNo,
        status: normalizeStatus(patient.queueStatus),
        moduleLabel: "Queue",
      }));
  }, [patients]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiFetch("/outpatient/queue/board");
      const data = await res.json().catch(() => null);
      const rows = normalizeQueueRows(data);
      if (rows.length > 0) {
        const notices: QueueNotice[] = rows.slice(0, 10).map((row, index) => ({
          id: String(row.id || row.tokenId || row.visitId || index),
          patientName:
            row.patientName ||
            row.patient?.name ||
            [row.patient?.firstName, row.patient?.lastName].filter(Boolean).join(" ") ||
            row.name ||
            "Queued patient",
          token: String(row.tokenNumber || row.queueNumber || row.patientCode || row.mrn || row.id || "Token"),
          status: normalizeStatus(row.status || row.queueStatus || row.stage || row.currentStage),
          moduleLabel: "Queue",
          priority: row.priority || row.triagePriority || row.urgency,
        }));
        setQueueNotices(notices);
      } else {
        setQueueNotices(buildFallbackQueue());
      }
    } catch {
      setQueueNotices(buildFallbackQueue());
    }
  }, [buildFallbackQueue]);

  useEffect(() => {
    try {
      const read = JSON.parse(window.localStorage.getItem("hmis.notifications.read") || "[]");
      const dismissed = JSON.parse(window.localStorage.getItem("hmis.notifications.dismissed") || "[]");
      if (Array.isArray(read)) setReadNotificationIds(read.map(String));
      if (Array.isArray(dismissed)) setDismissedNotificationIds(dismissed.map(String));
    } catch {
      window.localStorage.removeItem("hmis.notifications.read");
      window.localStorage.removeItem("hmis.notifications.dismissed");
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 90000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((current) => {
      const next = current.includes(id) ? current : [...current, id];
      window.localStorage.setItem("hmis.notifications.read", JSON.stringify(next));
      return next;
    });
  };

  const markAllNotificationsRead = () => {
    const next = Array.from(
      new Set([...readNotificationIds, ...visibleNotifications.map((n) => n.id)])
    );
    setReadNotificationIds(next);
    window.localStorage.setItem("hmis.notifications.read", JSON.stringify(next));
  };

  const dismissNotification = (id: string) => {
    setDismissedNotificationIds((current) => {
      const next = current.includes(id) ? current : [...current, id];
      window.localStorage.setItem("hmis.notifications.dismissed", JSON.stringify(next));
      return next;
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstMatch = moduleSearchResults[0];
    if (firstMatch) {
      setModuleSearch("");
      setSearchFocused(false);
      onOpenModule(firstMatch.id);
    }
  };

  const handleSelectSearchResult = (id: number) => {
    setModuleSearch("");
    setSearchFocused(false);
    onOpenModule(id);
  };

  const handleDoLogout = async () => {
    setLogoutConfirmOpen(false);
    setLoggingOut(true);
    try {
      onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = cleanDisplayName(userName);
  const displayFacilityName = pickHospitalName(facilityName) || "MediLink General Hospital";
  const userInitial = displayName.charAt(0).toUpperCase() || "U";
  const facilityIdLabel =
    String(facilityId).length > 24
      ? `${String(facilityId).slice(0, 12)}…${String(facilityId).slice(-8)}`
      : String(facilityId);

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showBack && (
          <button
            type="button"
            className="topbar-back-btn"
            onClick={onGoBack}
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        <form className="search-wrap" onSubmit={handleSearchSubmit}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255, 255, 255, 0.92)"
            strokeWidth="2"
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search modules..."
            value={moduleSearch}
            onChange={(event) => setModuleSearch(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)}
            autoComplete="off"
            aria-label="Search modules"
          />
          {searchFocused && moduleSearch.trim() && (
            <div className="module-search-panel">
              {moduleSearchResults.length > 0 ? (
                moduleSearchResults.map((module) => {
                  const Icon = getModuleIcon(module.id);
                  return (
                    <button
                      key={module.id}
                      type="button"
                      className="module-search-result"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectSearchResult(module.id)}
                    >
                      <Icon size={16} />
                      <span>
                        <strong>{module.name}</strong>
                        <small>{module.layer}</small>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="module-search-empty">No module found.</p>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="topbar-right">
        {/* Medilink AI Button */}
        <button
          type="button"
          className="topbar-icon-btn topbar-ai-btn"
          onClick={onOpenHelpAi}
          title="Open Medilink AI"
          aria-label="Open Medilink AI"
        >
          <span className="topbar-ai-mark" aria-hidden="true">
            <BrainCircuit size={18} strokeWidth={2.2} />
          </span>
          <span className="topbar-ai-label">AI</span>
        </button>

        {/* Settings Popover */}
        <div className="topbar-popover-wrap">
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => {
              setSettingsOpen((open) => !open);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            title="Account and system settings"
            aria-label="Open account and system settings"
            aria-expanded={settingsOpen}
          >
            <Settings size={17} />
          </button>
          {settingsOpen && (
            <div
              className="topbar-panel settings-panel"
              role="menu"
              aria-label="Account and system settings"
            >
              <div className="settings-panel-head">
                <div>
                  <strong>Settings</strong>
                  <span>Account, security, and HMIS preferences</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close settings"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="settings-menu-list">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenSettings("account");
                  }}
                >
                  <UserCircle size={17} />
                  <span>
                    <strong>Profile &amp; account</strong>
                    <small>Personal details and preferences</small>
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenSettings("security");
                  }}
                >
                  <Settings size={17} />
                  <span>
                    <strong>Password &amp; security</strong>
                    <small>Change password and sign-in protection</small>
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenSettings("notifications");
                  }}
                >
                  <Bell size={17} />
                  <span>
                    <strong>Notification preferences</strong>
                    <small>Control alerts and delivery preferences</small>
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenSettings("display");
                  }}
                >
                  <Settings size={17} />
                  <span>
                    <strong>Theme &amp; display</strong>
                    <small>Theme, language, and display options</small>
                  </span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSettingsOpen(false);
                      onOpenFacilitySettings();
                    }}
                  >
                    <Settings size={17} />
                    <span>
                      <strong>Facility settings</strong>
                      <small>Organization branding and configuration</small>
                    </span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSettingsOpen(false);
                      onOpenSettings("sessions");
                    }}
                  >
                    <Settings size={17} />
                    <span>
                      <strong>Sessions &amp; active devices</strong>
                      <small>Review sign-ins and devices</small>
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenHelpdesk();
                  }}
                >
                  <UserCircle size={17} />
                  <span>
                    <strong>Help &amp; system information</strong>
                    <small>Support, release, and system details</small>
                  </span>
                </button>
              </div>
              <div className="settings-panel-foot">
                <Settings size={14} /> Changes are subject to your role permissions.
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="topbar-popover-wrap">
          <button
            type="button"
            className="topbar-icon-btn topbar-notification-btn"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
              setSettingsOpen(false);
              void loadNotifications();
            }}
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell size={17} />
            {unreadNotificationCount > 0 && (
              <span className="topbar-alert-count">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="topbar-panel notification-panel">
              <div className="topbar-panel-header notification-panel-header">
                <div>
                  <strong>Notifications</strong>
                  <span>
                    {unreadNotificationCount
                      ? `${unreadNotificationCount} unread`
                      : "All caught up"}
                  </span>
                </div>
                <div className="notification-panel-actions">
                  <button
                    type="button"
                    onClick={() => void loadNotifications()}
                    title="Refresh notifications"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close notifications"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div className="notification-list">
                {visibleNotifications.length > 0 ? (
                  visibleNotifications.map((notice) => (
                    <div
                      key={notice.id}
                      className={`notification-item is-${notice.severity} ${
                        readNotificationIds.includes(notice.id)
                          ? "is-read"
                          : "is-unread"
                      }`}
                    >
                      <button
                        type="button"
                        className="notification-item-main"
                        onClick={() => {
                          markNotificationRead(notice.id);
                          onNavigateQueue();
                          setNotificationsOpen(false);
                        }}
                      >
                        <span className="notification-item-category">Queue update</span>
                        <strong>{notice.patientName}</strong>
                        <span>
                          {notice.token} queued for {notice.moduleLabel}
                        </span>
                      </button>
                      <div className="notification-item-meta">
                        <small>{notice.priority || notice.status}</small>
                        <button
                          type="button"
                          onClick={() => dismissNotification(notice.id)}
                          aria-label={`Dismiss notification for ${notice.patientName}`}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="topbar-panel-empty">No new notifications.</p>
                )}
              </div>
              <div className="notification-panel-footer">
                <button type="button" onClick={markAllNotificationsRead}>
                  Mark all as read
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    onOpenSettings("notifications");
                  }}
                >
                  Notification preferences
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          type="button"
          className="topbar-logout-btn topbar-danger-btn"
          onClick={() => setLogoutConfirmOpen(true)}
          disabled={loggingOut}
          title="Logout"
        >
          <LogOut size={16} />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>

        {/* User Pill & Profile Popover */}
        <div className="topbar-popover-wrap">
          <button
            type="button"
            className="user-pill"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
              setSettingsOpen(false);
            }}
            title="View profile"
          >
            <div className="avatar">{userInitial}</div>
            <div>
              <div className="user-name">{displayName}</div>
            </div>
          </button>
          {profileOpen && (
            <div
              className="topbar-panel profile-panel"
              role="dialog"
              aria-label="Signed-in account"
            >
              <div className="profile-hero">
                <div className="profile-hero-main">
                  <div className="profile-panel-avatar">
                    <UserCircle size={38} />
                  </div>
                  <div className="profile-hero-copy">
                    <span className="profile-kicker">Logged-in HMIS user</span>
                    <strong>{displayName}</strong>
                    <small>{userEmail}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="profile-close-btn"
                  onClick={() => setProfileOpen(false)}
                  aria-label="Close profile"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="profile-panel-body">
                <div className="profile-status-row">
                  <span className="profile-status-dot" aria-hidden="true" />
                  <span>
                    <strong>Active session</strong>
                    <small>Signed in securely</small>
                  </span>
                  <span
                    className="profile-facility-name"
                    title={displayFacilityName}
                  >
                    {displayFacilityName}
                  </span>
                </div>
                <dl className="profile-details">
                  <div>
                    <dt>Access role</dt>
                    <dd>{userRole}</dd>
                  </div>
                  <div>
                    <dt>Facility ID</dt>
                    <dd title={String(facilityId)}>{facilityIdLabel}</dd>
                  </div>
                  <div>
                    <dt>Account status</dt>
                    <dd className="profile-status-value">Active</dd>
                  </div>
                </dl>
              </div>
              <div className="profile-panel-footer">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenSettings("account");
                  }}
                >
                  <Settings size={15} /> Manage account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {logoutConfirmOpen ? (
        <div
          className="logout-confirm-backdrop"
          role="presentation"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <section
            className="logout-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="logout-confirm-icon">
              <LogOut size={22} />
            </div>
            <div className="logout-confirm-copy">
              <h3 id="logout-confirm-title">Confirm Logout</h3>
              <p>Are you sure you want to end this HMIS session?</p>
            </div>
            <div className="logout-confirm-actions">
              <button
                type="button"
                className="logout-confirm-cancel"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="logout-confirm-submit"
                onClick={handleDoLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </header>
  );
}
