// Ported from Medilink-Frontend/src/app/facilities/work-orders/page.tsx for desktop parity.
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "../lib/navigation";
import { ArrowLeft } from "lucide-react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function FacilitiesWorkOrdersView() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/facility-ops/maintenance-requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load work orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/facility-ops/maintenance/${id}/status`, { status });
      loadData();
    } catch (err: any) {
      alert(`Status update failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!search) return requests;
    const q = search.toLowerCase();
    return requests.filter((r: any) => 
      r.asset?.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const tableRows = filteredRequests.map((row: any) => ({
    id: row.id,
    asset: row.asset?.name || "Unknown Asset",
    description: row.description,
    priority: (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        row.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
        row.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
        row.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
        'bg-slate-100 text-slate-700'
      }`}>
        {row.priority}
      </span>
    ),
    status: (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        row.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
        row.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
        row.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-700' :
        'bg-amber-100 text-amber-700'
      }`}>
        {row.status?.replace('_', ' ')}
      </span>
    ),
    date: new Date(row.requestedAt).toLocaleDateString(),
    action: row.status === 'OPEN' ? (
      <button 
        onClick={() => handleUpdateStatus(row.id, 'IN_PROGRESS')}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
      >
        Start Work
      </button>
    ) : row.status === 'IN_PROGRESS' ? (
      <button 
        onClick={() => handleUpdateStatus(row.id, 'COMPLETED')}
        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium"
      >
        Mark Complete
      </button>
    ) : "-"
  }));

  return (
    <SimpleModulePlaceholder
      title="Maintenance Work Orders"
      subtitle="Track and resolve facility and equipment issues"
      icon={<ModuleIcon name="build" />}
      stats={[
        { label: "Total Requests", value: requests.length, color: "#1e3a8a" },
        { label: "Open Issues", value: requests.filter(r => r.status === 'OPEN').length, color: "#f59e0b" },
        { label: "Critical Priority", value: requests.filter(r => r.priority === 'CRITICAL').length, color: "#dc2626" },
      ]}
      columns={[
        { label: "Asset", key: "asset", className: "font-bold" },
        { label: "Issue Description", key: "description" },
        { label: "Priority", key: "priority" },
        { label: "Status", key: "status" },
        { label: "Reported On", key: "date" },
        { label: "Action", key: "action" },
      ]}
      rows={tableRows}
      searchPlaceholder="Search work orders by asset or description..."
      searchKeys={["asset", "description"]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push('/facilities')}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Assets
          </button>
        </div>
      }
    />
  );
}
