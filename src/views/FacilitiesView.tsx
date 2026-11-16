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
        <div className="module-form-overlay" onClick={() => setAddModal(false)}>
          <form onSubmit={handleAddAsset} className="module-form-panel modal-panel facilities-modal" onClick={(event) => event.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="domain" /></div>
                <div>
                  <div className="module-form-kicker">Facilities & Assets</div>
                  <h2 className="module-form-title">Register New Asset</h2>
                </div>
              </div>
              <button type="button" className="module-form-close" onClick={() => setAddModal(false)} aria-label="Close form">×</button>
            </div>
            <div className="module-form-body">
              <p className="module-form-note">Add a new piece of equipment or facility asset to the registry.</p>
              <div className="module-form-grid">
                <div className="module-form-field is-wide">
                  <label className="form-label">Asset Name</label>
                  <input required type="text" className="module-form-input"
                    value={assetForm.name} onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                    placeholder="e.g. MRI Scanner, Hospital Bed" />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Category</label>
                  <select required className="module-form-input"
                    value={assetForm.category} onChange={(e) => setAssetForm({...assetForm, category: e.target.value})}>
                    <option value="GENERAL">General</option>
                    <option value="MEDICAL_EQUIPMENT">Medical Equipment</option>
                    <option value="IT_INFRASTRUCTURE">IT Infrastructure</option>
                    <option value="VEHICLE">Vehicle / Fleet</option>
                    <option value="FURNITURE">Furniture</option>
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Initial Status</label>
                  <select required className="module-form-input"
                    value={assetForm.status} onChange={(e) => setAssetForm({...assetForm, status: e.target.value})}>
                    <option value="ACTIVE">Active</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Serial Number</label>
                  <input type="text" className="module-form-input"
                    value={assetForm.serialNumber} onChange={(e) => setAssetForm({...assetForm, serialNumber: e.target.value})} />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Assigned Department</label>
                  <input type="text" className="module-form-input"
                    value={assetForm.assignedDepartment} onChange={(e) => setAssetForm({...assetForm, assignedDepartment: e.target.value})}
                    placeholder="e.g. Radiology, ICU" />
                </div>
              </div>
            </div>
            <div className="module-form-footer">
              <button type="button" className="form-btn form-btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
              <button type="submit" disabled={adding} className="form-btn form-btn-primary module-form-submit">{adding ? "Saving..." : "Register Asset"}</button>
            </div>
          </form>
        </div>
      )}

      {issueModal && (
        <div className="module-form-overlay" onClick={() => setIssueModal(null)}>
          <form onSubmit={handleReportIssue} className="module-form-panel modal-panel facilities-modal" onClick={(event) => event.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="build" /></div>
                <div>
                  <div className="module-form-kicker">Facilities & Assets</div>
                  <h2 className="module-form-title">Report Issue</h2>
                </div>
              </div>
              <button type="button" className="module-form-close" onClick={() => setIssueModal(null)} aria-label="Close form">×</button>
            </div>
            <div className="module-form-body">
              <p className="module-form-note">Create a maintenance work order for <strong>{issueModal.name}</strong>.</p>
              <div className="module-form-grid">
                <div className="module-form-field is-wide">
                  <label className="form-label">Priority</label>
                  <select required className="module-form-input"
                    value={issueForm.priority} onChange={(e) => setIssueForm({...issueForm, priority: e.target.value})}>
                    <option value="LOW">Low (Routine)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent)</option>
                    <option value="CRITICAL">Critical (Safety/Ops Impact)</option>
                  </select>
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Issue Description</label>
                  <textarea required className="module-form-input"
                    value={issueForm.description} onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                    placeholder="Describe the problem..." rows={3} />
                </div>
              </div>
            </div>
            <div className="module-form-footer">
              <button type="button" className="form-btn form-btn-cancel" onClick={() => setIssueModal(null)}>Cancel</button>
              <button type="submit" disabled={reporting} className="form-btn form-btn-primary module-form-submit">{reporting ? "Submitting..." : "Submit Report"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export { FacilitiesDashboard as FacilityView };

export { FacilitiesDashboard as FacilitiesView };
