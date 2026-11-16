// Ported from Medilink-Frontend/src/app/inventory/purchase-orders/page.tsx for desktop parity.
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "../lib/navigation";
import { ArrowLeft } from "lucide-react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function InventoryPurchaseOrdersView() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [poModal, setPoModal] = useState(false);
  const [supplierModal, setSupplierModal] = useState(false);
  
  const [creatingPo, setCreatingPo] = useState(false);
  const [supplierId, setSupplierId] = useState("");

  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [poRes, supRes] = await Promise.all([
        api.get("/procurement/purchase-orders"),
        api.get("/procurement/suppliers")
      ]);
      setPurchaseOrders(poRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (err) {
      console.error("Failed to load PO data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPo(true);
    try {
      await api.post("/procurement/purchase-order", { supplierId });
      alert("Purchase Order created successfully!");
      setPoModal(false);
      setSupplierId("");
      loadData();
    } catch (err: any) {
      alert(`PO Creation Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setCreatingPo(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSupplier(true);
    try {
      await api.post("/procurement/supplier", supplierForm);
      alert("Supplier added successfully!");
      setSupplierModal(false);
      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "" });
      loadData();
    } catch (err: any) {
      alert(`Failed to add supplier: ${err.response?.data?.message || err.message}`);
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/procurement/purchase-order/${id}/status`, { status });
      loadData();
    } catch (err: any) {
      alert(`Status update failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const filteredPOs = useMemo(() => {
    if (!search) return purchaseOrders;
    const q = search.toLowerCase();
    return purchaseOrders.filter((po: any) => 
      po.poNumber?.toLowerCase().includes(q) ||
      po.supplier?.name?.toLowerCase().includes(q)
    );
  }, [purchaseOrders, search]);

  const tableRows = filteredPOs.map((row: any) => ({
    id: row.id,
    poNumber: <span className="font-mono text-slate-700">{row.poNumber}</span>,
    supplier: row.supplier?.name || "Unknown",
    date: new Date(row.orderDate).toLocaleDateString(),
    total: `Ksh ${row.totalAmount?.toLocaleString() || 0}`,
    status: (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        row.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
        row.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
        row.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
        'bg-amber-100 text-amber-700'
      }`}>
        {row.status}
      </span>
    ),
    action: row.status === 'PENDING' ? (
      <button 
        onClick={() => handleUpdateStatus(row.id, 'APPROVED')}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
      >
        Approve
      </button>
    ) : row.status === 'APPROVED' ? (
      <button 
        onClick={() => handleUpdateStatus(row.id, 'DELIVERED')}
        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium"
      >
        Mark Delivered
      </button>
    ) : "-"
  }));

  return (
    <>
      <SimpleModulePlaceholder
        title="Purchase Orders (PO)"
        subtitle="Manage supplier relationships and stock procurement"
        icon={<ModuleIcon name="shopping_cart" />}
        stats={[
          { label: "Active Suppliers", value: suppliers.length, color: "#1e3a8a" },
          { label: "Pending POs", value: purchaseOrders.filter(p => p.status === 'PENDING').length, color: "#f59e0b" },
          { label: "Approved POs", value: purchaseOrders.filter(p => p.status === 'APPROVED').length, color: "#0ea5e9" },
        ]}
        columns={[
          { label: "PO Number", key: "poNumber" },
          { label: "Supplier", key: "supplier", className: "font-bold" },
          { label: "Order Date", key: "date" },
          { label: "Est. Total", key: "total" },
          { label: "Status", key: "status" },
          { label: "Action", key: "action" },
        ]}
        rows={tableRows}
        searchPlaceholder="Search PO by number or supplier..."
        searchKeys={["poNumber", "supplier"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push('/inventory')}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Inventory
            </button>
            <button
              onClick={() => setSupplierModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
            >
              <ModuleIcon name="domain" /> Add Supplier
            </button>
            <button
              onClick={() => setPoModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#0284c7" }}
              type="button"
            >
              <ModuleIcon name="receipt_long" /> Create PO
            </button>
          </div>
        }
      />

      {poModal && (
        <div className="module-form-overlay" onClick={() => setPoModal(false)}>
          <form className="module-form-panel modal-panel inventory-po-modal" onSubmit={handleCreatePo} onClick={(event) => event.stopPropagation()}>
            <div className="module-form-header" style={{ background: "linear-gradient(180deg, #000 0%, #111 32%, #222 68%, #333 100%)" }}>
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="receipt_long" /></div>
                <div><div className="module-form-kicker">Inventory</div><h2 className="module-form-title">Create Purchase Order</h2></div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setPoModal(false)}>×</button>
            </div>
            <div className="module-form-body">
              <p className="module-form-note" style={{ marginBottom: 12 }}>Select a supplier to generate a new PO tracking number.</p>
              <div className="module-form-grid">
                <label className="module-form-field is-wide"><span>Supplier</span>
                  <select required className="module-form-input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
                {suppliers.length === 0 && (
                  <p className="module-form-field is-wide" style={{ color: "#dc2626", fontSize: ".85rem" }}>No suppliers found. Please add a supplier first.</p>
                )}
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setPoModal(false)}>Cancel</button>
                <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={creatingPo || !supplierId}>{creatingPo ? "Generating..." : "Generate PO"}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {supplierModal && (
        <div className="module-form-overlay" onClick={() => setSupplierModal(false)}>
          <form className="module-form-panel modal-panel inventory-supplier-modal" onSubmit={handleAddSupplier} onClick={(event) => event.stopPropagation()}>
            <div className="module-form-header" style={{ background: "linear-gradient(180deg, #000 0%, #111 32%, #222 68%, #333 100%)" }}>
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="domain" /></div>
                <div><div className="module-form-kicker">Inventory</div><h2 className="module-form-title">Register Supplier</h2></div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setSupplierModal(false)}>×</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <label className="module-form-field"><span>Vendor Name</span><input required type="text" className="module-form-input" value={supplierForm.name} onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})} /></label>
                <label className="module-form-field"><span>Contact Person</span><input required type="text" className="module-form-input" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({...supplierForm, contactPerson: e.target.value})} /></label>
                <label className="module-form-field"><span>Phone</span><input required type="tel" className="module-form-input" value={supplierForm.phone} onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})} /></label>
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setSupplierModal(false)}>Cancel</button>
                <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={creatingSupplier}>{creatingSupplier ? "Saving..." : "Save Supplier"}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
