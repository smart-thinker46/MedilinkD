import React, { useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Briefcase,
  Cable,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Crown,
  Droplets,
  FileText,
  GitMerge,
  GraduationCap,
  Handshake,
  HeartPulse,
  HelpCircle,
  IdCard,
  ListChecks,
  MapPin,
  Megaphone,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Users,
  UserX,
  Volume2,
  X,
} from "lucide-react";
import { MODULE_CATALOG, MODULE_SECTIONS, type ModuleCatalogItem } from "../../lib/moduleCatalog";
import { apiFetch } from "../../lib/apiClient";

type DesktopSidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  activeNav: number;
  activeWorkflowModuleId: number | null;
  onNavigateModule: (moduleId: number) => void;
  onNavigateNav: (navIndex: number) => void;
  userRole?: string;
  allowedModuleIds: Set<number>;
  facilityName: string;
  facilityLogo: string | null;
  onOpenHelpAi: () => void;
};

const orderReceivingModules: Record<number, string> = {
  2: "INPATIENT",
  8: "LABORATORY",
  9: "RADIOLOGY",
  10: "PHARMACY",
};

export function DesktopSidebar({
  collapsed,
  onToggleCollapsed,
  activeNav,
  activeWorkflowModuleId,
  onNavigateModule,
  onNavigateNav,
  userRole = "Hospital Admin",
  allowedModuleIds,
  facilityName,
  facilityLogo,
  onOpenHelpAi,
}: DesktopSidebarProps) {
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Patient Journey": true,
    Clinical: true,
    Administration: false,
    "Technology & Intelligence": false,
    "Support Services": false,
  });
  const [sidebarWaitingCount, setSidebarWaitingCount] = useState(0);

  // Active module determination
  const activeModuleItem = useMemo(() => {
    if (activeWorkflowModuleId) {
      return MODULE_CATALOG.find((m) => m.id === activeWorkflowModuleId) || null;
    }
    const navToModuleMap: Record<number, number> = {
      1: 1,   // Patients
      3: 4,   // Appointments
      4: 6,   // EHR
      5: 7,   // Nursing
      6: 5,   // Wards
      7: 8,   // Lab
      8: 9,   // Radiology
      9: 13,  // Billing
      10: 10, // Pharmacy
      11: 15, // Inventory
      14: 14, // Insurance
      15: 15, // Procurement
      16: 16, // HR
      17: 17, // Doctor
      18: 18, // Facility
      19: 19, // Analytics
      20: 20, // Users
      21: 21, // Telemedicine
      22: 22, // Blockchain
      23: 23, // AI Suite
      24: 24, // Patient Portal
      25: 25, // Emergency
      26: 26, // Ambulance
      27: 27, // Mortuary
      28: 28, // Queue
      29: 29, // Helpdesk
      30: 30, // Canteen
      31: 31, // Patient Feedback
      33: 33, // QA
      34: 34, // Integrations
      42: 64, // Migration
    };
    const modId = navToModuleMap[activeNav];
    return modId ? MODULE_CATALOG.find((m) => m.id === modId) || null : null;
  }, [activeNav, activeWorkflowModuleId]);

  const activeModuleId = activeModuleItem?.id || null;

  // Filter modules based on search and permissions
  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MODULE_SECTIONS.map((section) => ({
      layer: section.layer,
      items: section.items.filter((item) => {
        const matchesPermission = allowedModuleIds.size === 0 || allowedModuleIds.has(item.id);
        const matchesSearch = !q || item.name.toLowerCase().includes(q);
        return matchesPermission && matchesSearch;
      }),
    })).filter((section) => section.items.length > 0);
  }, [search, allowedModuleIds]);

  const toggleSection = (layer: string) => {
    setOpenSections((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Check waiting list count when activeModule changes
  useEffect(() => {
    if (!activeModuleId) {
      setSidebarWaitingCount(0);
      return;
    }
    let cancelled = false;
    const fetchWaiting = async () => {
      try {
        const res = await apiFetch(`/queue/board?moduleId=${activeModuleId}`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && typeof data?.waitingCount === "number") {
          setSidebarWaitingCount(data.waitingCount);
        }
      } catch {
        if (!cancelled) setSidebarWaitingCount(0);
      }
    };
    void fetchWaiting();
    return () => {
      cancelled = true;
    };
  }, [activeModuleId]);

  const isHospitalAdmin = String(userRole).toLowerCase().includes("admin");

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-top brand">
        <img
          src="/MedilinkHMIS.png"
          alt="Medilink HMIS"
          className="brand-logo-main"
          onClick={() => onNavigateNav(0)}
          style={{ cursor: "pointer" }}
        />
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Module Search Filter (when expanded) */}
      {!collapsed && (
        <div className="sidebar-search-container" style={{ padding: "8px 12px" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "4px 8px",
            }}
          >
            <Search size={14} style={{ color: "rgba(255, 255, 255, 0.6)", marginRight: 6 }} />
            <input
              type="text"
              placeholder="Search modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "0.78rem",
                width: "100%",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  padding: 2,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <nav
        className="sidebar-nav-scroll custom-scrollbar"
        style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}
      >
        {/* Core Quick Buttons */}
        <div style={{ marginBottom: 8 }}>
          <button
            type="button"
            className={`nav-item ${activeNav === 0 ? "active" : ""}`}
            onClick={() => onNavigateNav(0)}
            title="Dashboard Overview"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 10px",
              borderRadius: 6,
              background: activeNav === 0 ? "var(--hmis-selected-bg, #d7fbe9)" : "transparent",
              color: activeNav === 0 ? "var(--hmis-text, #111827)" : "inherit",
              border: "none",
              cursor: "pointer",
              fontWeight: activeNav === 0 ? 800 : 600,
              fontSize: "0.82rem",
            }}
          >
            <Briefcase size={16} />
            {!collapsed && <span>Dashboard Grid</span>}
          </button>
        </div>

        {/* Grouped Layer Navigation */}
        {filteredSections.map((section) => {
          const isOpen = openSections[section.layer] ?? true;
          return (
            <div key={section.layer} style={{ marginBottom: 8 }}>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.layer)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "4px 8px",
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    cursor: "pointer",
                  }}
                >
                  <span>{section.layer}</span>
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}

              {(isOpen || collapsed) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
                  {section.items.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeModuleId === item.id;
                    const receivingModule = orderReceivingModules[item.id];

                    return (
                      <div key={item.id} style={{ display: "flex", flexDirection: "column" }}>
                        <button
                          type="button"
                          className={`nav-item ${isActive ? "active" : ""}`}
                          onClick={() => onNavigateModule(item.id)}
                          title={item.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "6px 8px",
                            borderRadius: 6,
                            background: isActive
                              ? "var(--hmis-selected-bg, #d7fbe9)"
                              : "transparent",
                            color: isActive ? "#0f172a" : "inherit",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: isActive ? 800 : 500,
                            textAlign: "left",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <IconComponent
                              size={15}
                              style={{
                                flexShrink: 0,
                                color: isActive ? "var(--hmis-primary, #13d802)" : "inherit",
                              }}
                            />
                            {!collapsed && (
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.name}
                              </span>
                            )}
                          </div>
                          {!collapsed && item.premium && (
                            <Crown size={11} style={{ color: "#f59e0b", flexShrink: 0 }} />
                          )}
                        </button>

                        {/* Order Inbox trigger pill if active and order-receiving */}
                        {!collapsed && isActive && receivingModule && (
                          <button
                            type="button"
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent("hmis:open-module-orders", {
                                  detail: { destinationModule: receivingModule },
                                }),
                              )
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              margin: "3px 6px 6px 24px",
                              padding: "3px 8px",
                              background: "#7c3aed",
                              color: "#ffffff",
                              borderRadius: 4,
                              border: "none",
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            <ShoppingCart size={11} /> Orders Worklist
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Upgrade & AI Help */}
      <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        {isHospitalAdmin && (
          <button
            type="button"
            className="sidebar-upgrade-btn"
            onClick={() => onNavigateNav(40)}
            style={{ marginBottom: 6, width: "100%" }}
          >
            <Crown size={14} />
            {!collapsed && <span>Upgrade Plan</span>}
          </button>
        )}
        <button
          type="button"
          className="sidebar-help-btn"
          onClick={onOpenHelpAi}
          style={{ width: "100%" }}
        >
          <HelpCircle size={15} />
          {!collapsed && <span>Help AI</span>}
        </button>
      </div>

      {/* Facility Profile Card */}
      <div className="sidebar-hospital-card sidebar-hospital-profile">
        {facilityLogo ? (
          <img
            src={facilityLogo}
            className="sidebar-hospital-logo"
            alt={`${facilityName} logo`}
            title={facilityName}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#16a34a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.75rem",
              flexShrink: 0,
            }}
          >
            {facilityName.slice(0, 1).toUpperCase()}
          </div>
        )}
        {!collapsed && (
          <div className="sidebar-hospital-copy">
            <span>Active Facility</span>
            <strong title={facilityName}>{facilityName}</strong>
          </div>
        )}
      </div>
    </aside>
  );
}

