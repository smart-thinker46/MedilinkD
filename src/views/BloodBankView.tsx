
import { useEffect, useMemo, useState } from "react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

const rowsFromResponse = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

export default function BloodBankView() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [dashboardRes, stockRes, donorsRes, requestsRes, movementsRes] = await Promise.allSettled([
          api.get("/blood-bank/dashboard"),
          api.get("/blood-bank/stock"),
          api.get("/blood-bank/donors"),
          api.get("/blood-bank/requests"),
          api.get("/blood-bank/inventory-movements"),
        ]);
        if (!mounted) return;
        setDashboard(dashboardRes.status === "fulfilled" ? dashboardRes.value.data || null : null);
        setStock(stockRes.status === "fulfilled" ? rowsFromResponse(stockRes.value.data) : []);
        setDonors(donorsRes.status === "fulfilled" ? rowsFromResponse(donorsRes.value.data) : []);
        setRequests(
          requestsRes.status === "fulfilled" ? rowsFromResponse(requestsRes.value.data) : [],
        );
        setMovements(
          movementsRes.status === "fulfilled" ? rowsFromResponse(movementsRes.value.data) : [],
        );
      } catch {
        if (mounted) {
          setDashboard(null);
          setStock([]);
          setDonors([]);
          setRequests([]);
          setMovements([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    const handleRefresh = () => setRefreshKey((value) => value + 1);
    window.addEventListener("hmis:blood-bank-refresh", handleRefresh);
    return () => window.removeEventListener("hmis:blood-bank-refresh", handleRefresh);
  }, []);

  const effectiveStock = useMemo(
    () => (Array.isArray(dashboard?.stock) && dashboard.stock.length > 0 ? dashboard.stock : stock),
    [dashboard, stock],
  );

  const stats = useMemo(() => {
    const totals = dashboard?.totals || {};
    const stockNearExpiryUnits = effectiveStock.reduce((sum: number, row: any) => {
      if (!Array.isArray(row?.componentBreakdown)) return sum;
      return (
        sum +
        row.componentBreakdown.reduce(
          (subtotal: number, component: any) => subtotal + Number(component?.nearExpiryUnits || 0),
          0,
        )
      );
    }, 0);
    const now = Date.now();
    const movementNearExpiryUnits = movements
      .filter((row) => String(row?.status || "").toUpperCase() === "AVAILABLE")
      .reduce((sum: number, row: any) => {
        const expiryTime = new Date(String(row?.expiryDate || "")).getTime();
        if (!Number.isFinite(expiryTime)) return sum;
        const days = (expiryTime - now) / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 7 ? sum + Number(row?.units || 0) : sum;
      }, 0);
    const fallbackDiscardedExpired = movements
      .filter((row) => ["DISCARDED", "EXPIRED"].includes(String(row?.status || "").toUpperCase()))
      .reduce((sum, row) => sum + Number(row?.units || 0), 0);
    const value = (key: string, fallback: number) => {
      if (loading) return "...";
      const dashboardValue = Number(totals?.[key] ?? 0);
      const fallbackValue = Number(fallback || 0);
      return Math.max(
        Number.isFinite(dashboardValue) ? dashboardValue : 0,
        Number.isFinite(fallbackValue) ? fallbackValue : 0,
      );
    };
    return [
      { label: "Near Expiry Units", value: value("nearExpiryUnits", stockNearExpiryUnits || movementNearExpiryUnits), color: "#f59e0b" },
      { label: "Discarded/Expired", value: value("expiredOrDiscardedUnits", fallbackDiscardedExpired), color: "#dc2626" },
      { label: "Donors", value: value("donorCount", donors.length), color: "#0d9488" },
      { label: "Total Requests", value: value("totalRequests", requests.length), color: "#1e3a8a" },
    ];
  }, [dashboard, donors.length, effectiveStock, loading, movements, requests.length]);

  const rows = useMemo(
    () =>
      effectiveStock.map((row: any) => ({
        group: row?.bloodGroup || "—",
        units: Number(row?.unitsAvailable || 0),
        expiry:
          Array.isArray(row?.componentBreakdown) && row.componentBreakdown.some((item: any) => Number(item?.nearExpiryUnits || 0) > 0)
            ? "Near expiry"
            : "—",
        status: Number(row?.unitsAvailable || 0) > 0 ? "Available" : "Low Stock",
      })),
    [effectiveStock],
  );

  return (
    <SimpleModulePlaceholder
      title="Blood Bank"
      subtitle="Donor registry and transfusion inventory"
      icon={<ModuleIcon name="opacity" />}
      stats={stats}
      columns={[
        { label: "Blood Group", key: "group" },
        { label: "Units", key: "units" },
        { label: "Expiry", key: "expiry" },
        { label: "Status", key: "status" },
      ]}
      rows={rows}
      searchPlaceholder="Search blood products"
      searchKeys={["group", "status"]}
      useProvidedActions
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="topbar-logout-btn" style={{ backgroundColor: "#7c3aed", borderColor: "#6d28d9", color: "#ffffff", boxShadow: "0 8px 18px rgba(124, 58, 237, 0.24)" }}><ModuleIcon name="sync_alt" /> Crossmatch</button>
          <button type="button" className="topbar-logout-btn" style={{ backgroundColor: "#b91c1c", borderColor: "#991b1b", color: "#ffffff", boxShadow: "0 8px 18px rgba(185, 28, 28, 0.24)" }}><ModuleIcon name="warning" /> Reaction Report</button>
        </div>
      }
    />
  );
}
