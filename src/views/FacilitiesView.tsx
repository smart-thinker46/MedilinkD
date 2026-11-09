"use client";

import { useEffect, useState, useMemo } from "react";
const useRouter = () => ({ push: (path: string) => window.dispatchEvent(new CustomEvent("hmis:navigate", { detail: { path } })) });
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function FacilitiesDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [assetForm, setAssetForm] = useState({
    name: "",
    category: "GENERAL",
    status: "ACTIVE",
    serialNumber: "",
    supplier: "",
    assignedDepartment: ""
  });

  const [issueModal, setIssueModal] = useState<any>(null);
  const [reporting, setReporting] = useState(false);
  const [issueForm, setIssueForm] = useState({
    description: "",
    priority: "MEDIUM"
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, assRes] = await Promise.all([
        api.get("/facility-ops/dashboard"),
        api.get("/facility-ops/assets")
      ]);
      setDashboard(dashRes.data);
      setAssets(assRes.data || []);
    } catch (err) {
      console.error("Failed to load facilities data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/facility-ops/asset", assetForm);
      alert("Asset registered successfully!");
      setAddModal(false);
      setAssetForm({ name: "", category: "GENERAL", status: "ACTIVE", serialNumber: "", supplier: "", assignedDepartment: "" });
      loadData();
    } catch (err: any) {
      alert(`Registration Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setReporting(true);
    try {
      await api.post("/facility-ops/maintenance", {
        assetId: issueModal.id,
        description: issueForm.description,
        priority: issueForm.priority
      });
      alert("Maintenance issue reported successfully!");
      setIssueModal(null);
      setIssueForm({ description: "", priority: "MEDIUM" });
      loadData();
    } catch (err: any) {
      alert(`Reporting Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setReporting(false);
    }
  };

  const filteredAssets = useMemo(() => {
    if (!search) return assets;
    const q = search.toLowerCase();
    return assets.filter((a: any) => 
      a.name?.toLowerCase().includes(q) ||
      a.metadata?.serialNumber?.toLowerCase().includes(q) ||
      a.metadata?.assignedDepartment?.toLowerCase().includes(q)
    );
  }, [assets, search]);

  const tableRows = filteredAssets.map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    department: row.metadata?.assignedDepartment || "Unassigned",
    serial: row.metadata?.serialNumber || "-",
    status: (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
        row.status === 'UNDER_MAINTENANCE' ? 'bg-orange-100 text-orange-700' :
        row.status === 'DAMAGED' ? 'bg-red-100 text-red-700' :
        'bg-slate-100 text-slate-700'
      }`}>
        {row.status?.replace('_', ' ')}
      </span>
    ),
    action: row.status === 'ACTIVE' ? (
      <button 
        onClick={() => setIssueModal(row)}
        className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 font-medium"
      >
        Report Issue
      </button>
    ) : "-"
  }));

  return (
    <>
      <SimpleModulePlaceholder
        title="Facilities & Assets"
        subtitle="Manage hospital equipment, maintenance requests, and physical spaces"
        icon={<ModuleIcon name="domain" />}
        stats={[
          { label: "Total Assets", value: dashboard?.assets?.total || 0, color: "#1e3a8a" },
          { label: "Active Equipment", value: dashboard?.assets?.active || 0, color: "#16a34a" },
          { label: "Under Maintenance", value: dashboard?.assets?.underMaintenance || 0, color: "#f59e0b" },
          { label: "Open Work Orders", value: dashboard?.maintenance?.open || 0, color: "#dc2626" },
        ]}
        columns={[
          { label: "Asset Name", key: "name", className: "font-bold" },
          { label: "Category", key: "category" },
          { label: "Department", key: "department" },
          { label: "Serial No.", key: "serial" },
          { label: "Status", key: "status" },
          { label: "Action", key: "action" },
        ]}
        rows={tableRows}
        searchPlaceholder="Search assets by name or department..."
        searchKeys={["name", "department"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push('/facilities/work-orders')}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
            >
              <ModuleIcon name="build" /> Work Orders
            </button>
            <button
              onClick={() => setAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#0284c7" }}
              type="button"
            >
              <ModuleIcon name="add_circle" /> Register Asset
            </button>
          </div>
        }
      />

      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleAddAsset} className="bg-card p-6 rounded-2xl border border-border shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-2 text-sky-700 flex items-center gap-2">
               <ModuleIcon name="domain" /> Register New Asset
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add a new piece of equipment or facility asset to the registry.
            </p>

            <div className="space-y-4">
              <div>
                <label className="form-label">Asset Name</label>
                <input required type="text" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" 
                  value={assetForm.name} onChange={(e) => setAssetForm({...assetForm, name: e.target.value})} 
                  placeholder="e.g. MRI Scanner, Hospital Bed" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <select required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                    value={assetForm.category} onChange={(e) => setAssetForm({...assetForm, category: e.target.value})}>
                    <option value="GENERAL">General</option>
                    <option value="MEDICAL_EQUIPMENT">Medical Equipment</option>
                    <option value="IT_INFRASTRUCTURE">IT Infrastructure</option>
                    <option value="VEHICLE">Vehicle / Fleet</option>
                    <option value="FURNITURE">Furniture</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Initial Status</label>
                  <select required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                    value={assetForm.status} onChange={(e) => setAssetForm({...assetForm, status: e.target.value})}>
                    <option value="ACTIVE">Active</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="form-label">Serial Number</label>
                    <input type="text" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" 
                      value={assetForm.serialNumber} onChange={(e) => setAssetForm({...assetForm, serialNumber: e.target.value})} />
                 </div>
                 <div>
                    <label className="form-label">Assigned Department</label>
                    <input type="text" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" 
                      value={assetForm.assignedDepartment} onChange={(e) => setAssetForm({...assetForm, assignedDepartment: e.target.value})} 
                      placeholder="e.g. Radiology, ICU" />
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {adding ? "Saving..." : "Register Asset"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {issueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleReportIssue} className="bg-card p-6 rounded-2xl border border-border shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-2 text-amber-600">Report Issue</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create a maintenance work order for <span className="font-bold text-slate-800">{issueModal.name}</span>.
            </p>
            
            <div className="space-y-4">
               <div>
                  <label className="form-label">Priority</label>
                  <select required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                    value={issueForm.priority} onChange={(e) => setIssueForm({...issueForm, priority: e.target.value})}>
                    <option value="LOW">Low (Routine)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent)</option>
                    <option value="CRITICAL">Critical (Safety/Ops Impact)</option>
                  </select>
               </div>
               <div>
                  <label className="form-label">Issue Description</label>
                  <textarea required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" 
                    value={issueForm.description} onChange={(e) => setIssueForm({...issueForm, description: e.target.value})} 
                    placeholder="Describe the problem..." rows={3} />
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
              <button type="button" onClick={() => setIssueModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">Cancel</button>
              <button type="submit" disabled={reporting} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-50">{reporting ? "Submitting..." : "Submit Report"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export { FacilitiesDashboard as FacilityView };

export { FacilitiesDashboard as FacilitiesView };
