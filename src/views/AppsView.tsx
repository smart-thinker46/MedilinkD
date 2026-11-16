// Ported from Medilink-Frontend/src/app/apps/page.tsx for desktop parity.
import Link from "../lib/navigation";
import { Building2, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "../store/appStore";
import { MODULE_SECTIONS } from "../lib/moduleCatalog";
import { getModuleIcon } from "../lib/moduleIconMap";
import { api } from "../lib/api";
import {
  firstNameForGreeting,
  pickHospitalName,
  readSetupBranding,
} from "../lib/utils";

const MODULES = MODULE_SECTIONS.flatMap((section) => section.items);

const readSetupHospitalName = () => {
  return readSetupBranding().name || "";
};

const renderIcon = (id: number) => {
  const Icon = getModuleIcon(id);
  return <Icon className="module-icon-svg" />;
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

export default function AppsView() {
  const { facility, user, activeModuleCategory, setActiveModuleCategory } = useAppStore();
  const [setupHospitalName, setSetupHospitalName] = useState("");
  const [allowedModuleIds, setAllowedModuleIds] = useState<number[] | null>(null);
  const [accessRole, setAccessRole] = useState("");
  const adminHasFullAccess = isAdminLikeRole(user?.role, accessRole);
  const accessFilteredModules =
    !adminHasFullAccess && allowedModuleIds && allowedModuleIds.length > 0
      ? MODULES.filter((module) => allowedModuleIds.includes(module.id))
      : MODULES;
  const visibleModules =
    activeModuleCategory === "All"
      ? accessFilteredModules
      : accessFilteredModules.filter((mod) => mod.layer === activeModuleCategory);
  const hospitalName = pickHospitalName(facility?.name, setupHospitalName);

  useEffect(() => {
    setSetupHospitalName(readSetupHospitalName());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "hmis_first_setup") {
        setSetupHospitalName(readSetupHospitalName());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .get("/security/access/me")
      .then((response) => {
        if (!mounted) return;
        setAccessRole(
          String(
            response.data?.roleName ||
              response.data?.roleLabel ||
              response.data?.role ||
              "",
          ),
        );
        const ids = Array.isArray(response.data?.moduleIds)
          ? response.data.moduleIds.map((id: unknown) => Number(id)).filter(Number.isFinite)
          : null;
        setAllowedModuleIds(isAdminLikeRole(user?.role, response.data?.roleName, response.data?.roleLabel) ? null : ids && ids.length > 0 ? ids : null);
      })
      .catch(() => {
        if (mounted) setAllowedModuleIds(user?.moduleIds?.length ? user.moduleIds : null);
      });
    return () => {
      mounted = false;
    };
  }, [user?.moduleIds, user?.role]);

  return (
    <>
      <section className="welcome" aria-label="Welcome to Medilink">
        <div className="welcome-icon" aria-hidden="true"><Building2 size={20} /></div>
        <div className="welcome-copy">
          <span className="welcome-kicker">MEDILINK HMIS</span>
          <h2>Welcome back, {firstNameForGreeting(user?.name)}</h2>
          <p>
            {hospitalName ? <><strong>{hospitalName}</strong><span>Command center</span></> : "Select a module to manage your facility"}
          </p>
        </div>
        {activeModuleCategory !== "All" && (
          <div className="module-filter-row">
            <span className="module-filter-label">
              Showing: {activeModuleCategory}
            </span>
            <button
              type="button"
              className="module-filter-clear"
              onClick={() => setActiveModuleCategory("All")}
            >
              Clear Filter
            </button>
          </div>
        )}
      </section>
      <div className="module-grid">
        {visibleModules.map((mod) => (
          <Link
            key={`${mod.id}-${mod.path}`}
            href={mod.path}
            className={`module-card ${mod.premium ? "card-premium" : "card-free"}`}
          >
            {mod.premium && (
              <div className="premium-pill">
                <Crown className="h-3 w-3" />
                <span>PREMIUM</span>
              </div>
            )}
            <div className="card-icon">{renderIcon(mod.id)}</div>
            <span className="card-label">{mod.name.replace("\n", " ")}</span>
          </Link>
        ))}
        {visibleModules.length === 0 && (
          <div className="p-4">
            No modules are assigned to your account for this category.
          </div>
        )}
      </div>
    </>
  );
}
