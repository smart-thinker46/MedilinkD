
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  PackagePlus,
  RefreshCw,
  Search,
  Send,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const money = (value: unknown) => `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
const today = new Date().toISOString().slice(0, 10);

const emptyItem = { itemName: "", category: "CONSUMABLES", unitType: "BOX", storeLocation: "Main Medical Store", currentStock: "0", minimumStockLevel: "10", safetyStockLevel: "5", standardOrderQuantity: "20", unitCost: "0" };
const emptyStore = { storeName: "", storeType: "MEDICAL", managerName: "", location: "" };
const emptyTransfer = { itemName: "", itemId: "", fromStore: "Main Medical Store", toStore: "", quantity: "", urgency: "NORMAL", notes: "" };
const emptyBatch = { itemId: "", itemName: "", batchNumber: "", expiryDate: "", quantity: "", unitCost: "", supplierName: "" };
const emptyCount = { storeName: "", itemName: "", systemQuantity: "", physicalQuantity: "", unitCost: "", varianceReason: "", countedBy: "" };
const emptySupplier = { supplierName: "", onTimeDeliveryRate: "", qualityPassRate: "", priceVariancePercent: "", recommendations: "" };

const unwrapRows = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results, data?.suppliers, data?.purchaseOrders, data?.data]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const unwrapObject = (value: any): any => {
  const data = value?.data ?? value;
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
};

export default function InventoryView() {
  const [items, setItems] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [reorders, setReorders] = useState<any[]>([]);
  const [expiry, setExpiry] = useState<any>({});
  const [counts, setCounts] = useState<any[]>([]);
  const [supplierScores, setSupplierScores] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);
  const [modal, setModal] = useState<"item" | "store" | "transfer" | "batch" | "count" | "supplier" | "">("");
  const [itemForm, setItemForm] = useState(emptyItem);
  const [storeForm, setStoreForm] = useState(emptyStore);
  const [transferForm, setTransferForm] = useState(emptyTransfer);
  const [batchForm, setBatchForm] = useState(emptyBatch);
  const [countForm, setCountForm] = useState(emptyCount);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "success" ? 2600 : 4200);
  };

  const loadData = async () => {
    setLoading(true);
    const sources: Array<[string, Promise<any>]> = [
      ["items", api.get("/procurement/items")],
      ["stores", api.get("/procurement/stores")],
      ["transfers", api.get("/procurement/transfers")],
      ["reorder queue", api.get("/procurement/reorder-requests")],
      ["expiry dashboard", api.get("/procurement/expiry-dashboard")],
      ["stock counts", api.get("/procurement/stock-counts")],
      ["supplier evaluations", api.get("/procurement/supplier-evaluations")],
      ["suppliers", api.get("/procurement/suppliers")],
      ["purchase orders", api.get("/procurement/purchase-orders")],
    ];
    const results = await Promise.allSettled(sources.map(([, request]) => request));
    const failed: string[] = [];
    const value = (index: number) => {
      const result = results[index];
      if (result.status === "fulfilled") return result.value;
      const status = result.reason?.response?.status;
      failed.push(`${sources[index][0]}${status ? ` (${status})` : ""}`);
      return null;
    };
    const itemsRes = value(0);
    const storesRes = value(1);
    const transfersRes = value(2);
    const reorderRes = value(3);
    const expiryRes = value(4);
    const countRes = value(5);
    const scoreRes = value(6);
    const suppliersRes = value(7);
    const purchaseOrdersRes = value(8);
    if (itemsRes) setItems(unwrapRows(itemsRes.data));
    if (storesRes) setStores(unwrapRows(storesRes.data));
    if (transfersRes) setTransfers(unwrapRows(transfersRes.data));
    if (reorderRes) setReorders(unwrapRows(reorderRes.data));
    if (expiryRes) setExpiry(unwrapObject(expiryRes.data));
    if (countRes) setCounts(unwrapRows(countRes.data));
    if (scoreRes) setSupplierScores(unwrapRows(scoreRes.data));
    if (suppliersRes) setSuppliers(unwrapRows(suppliersRes.data));
    if (purchaseOrdersRes) setPurchaseOrders(unwrapRows(purchaseOrdersRes.data));
    setSourceErrors(failed);
    if (failed.length) showNotice(`${failed.length} inventory data source${failed.length === 1 ? "" : "s"} could not be loaded: ${failed.join(", ")}.`, "warning");
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useLiveRefresh(() => loadData(), { intervalMs: 60000 });

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const hay = [item.itemName, item.name, item.category, item.storeLocation].join(" ").toLowerCase();
      const store = String(item.storeLocation || "Main Medical Store");
      return (!q || hay.includes(q)) && (storeFilter === "ALL" || store === storeFilter);
    });
  }, [items, search, storeFilter]);

  const lowStock = items.filter((item) => Number(item.currentStock ?? item.quantity) <= Number(item.reorderLevel ?? item.minimumStockLevel));
  const criticalStock = items.filter((item) => Number(item.currentStock ?? item.quantity) <= Number(item.safetyStockLevel || Math.floor(Number(item.reorderLevel ?? (item.minimumStockLevel || 0)) / 2)));
  const totalValue = items.reduce((sum, item) => sum + Number((item.currentStock ?? item.quantity) || 0) * Number(item.unitCost || 0), 0);
  const expiry30 = expiry?.within30?.length || 0;
  const storeNames = Array.from(new Set([...stores.map((s) => s.storeName), ...items.map((i) => i.storeLocation || "Main Medical Store")].filter(Boolean)));

  const stats = [
    { label: "Stores", value: stores.length, color: "#2563eb", icon: <Store size={20} /> },
    { label: "Stock Items", value: items.length, color: "#16a34a", icon: <Boxes size={20} /> },
    { label: "Low Stock", value: lowStock.length, color: "#dc2626", icon: <AlertTriangle size={20} /> },
    { label: "Critical", value: criticalStock.length, color: "#b91c1c", icon: <AlertTriangle size={20} /> },
    { label: "Expiring 30d", value: expiry30, color: "#d97706", icon: <ClipboardCheck size={20} /> },
    { label: "Stock Value", value: money(totalValue), color: "#0f766e", icon: <ShoppingCart size={20} /> },
  ];

  const post = async (endpoint: string, body: any, success: string, reset?: () => void) => {
    setSaving(true);
    try {
      await api.post(endpoint, body);
      reset?.();
      setModal("");
      showNotice(success);
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Save failed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void post("/procurement/item", {
      itemName: itemForm.itemName,
      name: itemForm.itemName,
      category: itemForm.category,
      unitType: itemForm.unitType,
      currentStock: Number(itemForm.currentStock || 0),
      quantity: Number(itemForm.currentStock || 0),
      minimumStockLevel: Number(itemForm.minimumStockLevel || 0),
      reorderLevel: Number(itemForm.minimumStockLevel || 0),
      safetyStockLevel: Number(itemForm.safetyStockLevel || 0),
      standardOrderQuantity: Number(itemForm.standardOrderQuantity || itemForm.minimumStockLevel || 0),
      unitCost: Number(itemForm.unitCost || 0),
      storeLocation: itemForm.storeLocation,
    }, "Inventory item created.", () => setItemForm(emptyItem));
  };

  const submitStore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void post("/procurement/stores", storeForm, "Store location configured.", () => setStoreForm(emptyStore));
  };

  const submitTransfer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void post("/procurement/transfers", { ...transferForm, quantity: Number(transferForm.quantity || 0) }, "Transfer request created.", () => setTransferForm(emptyTransfer));
  };

  const submitBatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void post("/procurement/batch-receipts", { ...batchForm, quantity: Number(batchForm.quantity || 0), unitCost: Number(batchForm.unitCost || 0) }, "Batch receipt saved with expiry tracking.", () => setBatchForm(emptyBatch));
  };

  const submitCount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void post("/procurement/stock-counts", {
      ...countForm,
      systemQuantity: Number(countForm.systemQuantity || 0),
      physicalQuantity: Number(countForm.physicalQuantity || 0),
      unitCost: Number(countForm.unitCost || 0),
    }, "Physical stock count variance saved.", () => setCountForm(emptyCount));
  };

  const submitSupplier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void post("/procurement/supplier-evaluations", {
      ...supplierForm,
      onTimeDeliveryRate: Number(supplierForm.onTimeDeliveryRate || 0),
      qualityPassRate: Number(supplierForm.qualityPassRate || 0),
      priceVariancePercent: Number(supplierForm.priceVariancePercent || 0),
    }, "Supplier scorecard saved.", () => setSupplierForm(emptySupplier));
  };

  const runReorder = async () => {
    setSaving(true);
    try {
      const res = await api.post("/procurement/reorder/run");
      showNotice(`${res.data?.count || 0} reorder request(s) generated.`);
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Reorder review failed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const transferStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/procurement/transfers/${id}/status`, { status });
      showNotice(`Transfer marked ${status.toLowerCase()}.`);
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Transfer update failed."), "error");
    }
  };

  return (
    <main className="inventory-page">
      <header className="inventory-header">
        <div><h1>Inventory Management</h1><p>Multi-store stock control, automated reorder, FEFO batch expiry, physical counts, and supplier scorecards.</p></div>
        <div className="inventory-actions">
          <button className="inventory-btn ghost" onClick={() => void loadData()} disabled={loading} type="button"><RefreshCw size={17} /> Refresh</button>
          <button className="inventory-btn green" onClick={() => setModal("item")} type="button"><PackagePlus size={17} /> Add Item</button>
          <button className="inventory-btn blue" onClick={() => setModal("transfer")} type="button"><Send size={17} /> Transfer</button>
          <button className="inventory-btn purple" onClick={() => void runReorder()} disabled={saving} type="button"><ShoppingCart size={17} /> Run Reorder</button>
        </div>
      </header>

      <section className="inventory-stats">{stats.map((stat) => <article className="inventory-stat" style={{ borderLeftColor: stat.color }} key={stat.label}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><i style={{ color: stat.color }}>{stat.icon}</i></article>)}</section>

      <section className="inventory-filter-panel">
        <label className="inventory-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search item, category, store..." /></label>
        <select value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)}><option value="ALL">All stores</option>{storeNames.map((name) => <option value={name} key={name}>{name}</option>)}</select>
        <button type="button" onClick={() => setModal("store")}>Configure Store</button>
        <button type="button" onClick={() => setModal("batch")}>Receive Batch</button>
        <button type="button" onClick={() => setModal("count")}>Stock Count</button>
        <button type="button" onClick={() => setModal("supplier")}>Supplier Score</button>
      </section>

      {sourceErrors.length ? <div className="inventory-source-warning" role="status"><AlertTriangle size={16} /> Some inventory data may be incomplete. Check your connection or permissions, then refresh.</div> : null}

      <section className="inventory-grid">
        <div className="inventory-main">
          <InventoryPanel title="Stock by Store and Reorder Levels">
            <InventoryTable>
              <thead><tr><th>Item</th><th>Category</th><th>Store</th><th>Current</th><th>Reorder</th><th>Value</th><th>Action</th></tr></thead>
              <tbody>{filteredItems.length ? filteredItems.map((item) => {
                const current = Number((item.currentStock ?? item.quantity) || 0);
                const reorder = Number((item.reorderLevel ?? item.minimumStockLevel) || 0);
                return <tr key={item.id} onClick={() => setSelected(item)}><td><strong>{item.itemName || item.name}</strong><small>{item.unitType || "UNIT"}</small></td><td>{item.category}</td><td>{item.storeLocation || "Main Medical Store"}</td><td className={current <= reorder ? "danger" : "ok"}>{current}</td><td>{reorder}</td><td>{money(current * Number(item.unitCost || 0))}</td><td><button type="button" onClick={(event) => { event.stopPropagation(); setBatchForm((f) => ({ ...f, itemId: item.id, itemName: item.itemName || item.name, unitCost: String(item.unitCost || 0) })); setModal("batch"); }}>Receive</button></td></tr>;
              }) : <tr><td colSpan={7} className="inventory-empty">No inventory items found.</td></tr>}</tbody>
            </InventoryTable>
          </InventoryPanel>

          <InventoryPanel title="Formal Store Transfers">
            <InventoryTable>
              <thead><tr><th>Item</th><th>From</th><th>To</th><th>Qty</th><th>Status</th><th>Workflow</th></tr></thead>
              <tbody>{transfers.length ? transfers.slice(0, 12).map((row) => <tr key={row.transferId} onClick={() => setSelected(row)}><td><strong>{row.itemName}</strong><small>{row.urgency}</small></td><td>{row.fromStore}</td><td>{row.toStore}</td><td>{row.quantity}</td><td><span className="inventory-pill">{row.status}</span></td><td><div className="inventory-row-actions"><button type="button" disabled={row.status !== "REQUESTED"} onClick={(e) => { e.stopPropagation(); void transferStatus(row.transferId, "DISPATCHED"); }}>Dispatch</button><button type="button" disabled={row.status === "RECEIVED"} onClick={(e) => { e.stopPropagation(); void transferStatus(row.transferId, "RECEIVED"); }}>Receive</button></div></td></tr>) : <tr><td colSpan={6} className="inventory-empty">No transfer requests yet.</td></tr>}</tbody>
            </InventoryTable>
          </InventoryPanel>
        </div>

        <aside className="inventory-side">
          <section className="inventory-selected"><span>Selected Record</span><h2>{selected?.itemName || selected?.name || selected?.supplierName || "No record selected"}</h2><dl><div><dt>Stock</dt><dd>{selected?.currentStock ?? selected?.quantity ?? "-"}</dd></div><div><dt>Status</dt><dd>{selected?.status || selected?.category || "-"}</dd></div><div><dt>Value</dt><dd>{money((selected?.currentStock ?? selected?.quantity ?? 0) * Number(selected?.unitCost || 0))}</dd></div></dl></section>

          <InventoryPanel title="Automated Reorder Queue">{reorders.length ? <div className="inventory-list">{reorders.slice(0, 8).map((row) => <button key={row.reorderRequestId} type="button" onClick={() => setSelected(row)}><span><strong>{row.itemName}</strong><small>Current {row.currentStock} · reorder {row.orderQuantity}</small></span><b>{row.status}</b></button>)}</div> : <p className="inventory-note">No reorder requests. Run reorder review to scan low stock.</p>}</InventoryPanel>
          <InventoryPanel title="Batch Expiry FEFO Dashboard">{expiry?.all?.length ? <div className="inventory-list">{expiry.all.slice(0, 8).map((row: any) => <button key={row.batchReceiptId} type="button" onClick={() => setSelected(row)}><span><strong>{row.itemName}</strong><small>Batch {row.batchNumber || "-"} · {row.daysToExpiry} day(s)</small></span><b>{money(row.potentialLoss)}</b></button>)}</div> : <p className="inventory-note">No batches expiring within 90 days.</p>}</InventoryPanel>
          <InventoryPanel title="Physical Stock Count Variances">{counts.length ? <div className="inventory-list">{counts.slice(0, 6).map((row) => <button key={row.stockCountId} type="button" onClick={() => setSelected(row)}><span><strong>{row.itemName}</strong><small>{row.storeName} · variance {row.variance}</small></span><b>{row.status}</b></button>)}</div> : <p className="inventory-note">No stock counts recorded.</p>}</InventoryPanel>
          <InventoryPanel title="Supplier Performance Scorecard">{supplierScores.length ? <div className="inventory-list">{supplierScores.slice(0, 6).map((row) => <button key={row.supplierEvaluationId} type="button" onClick={() => setSelected(row)}><span><strong>{row.supplierName}</strong><small>On-time {row.onTimeDeliveryRate}% · Quality {row.qualityPassRate}%</small></span><b>{row.status}</b></button>)}</div> : <p className="inventory-note">No supplier evaluations yet.</p>}</InventoryPanel>
          <InventoryPanel title="Suppliers and Purchase Orders"><div className="inventory-mini-summary"><span><strong>{suppliers.length}</strong> suppliers</span><span><strong>{purchaseOrders.length}</strong> purchase orders</span></div>{purchaseOrders.length ? <div className="inventory-list">{purchaseOrders.slice(0, 5).map((row) => <button key={row.id || row.poNumber} type="button" onClick={() => setSelected(row)}><span><strong>{row.poNumber || "Purchase order"}</strong><small>{row.supplier?.name || row.supplierName || "Supplier not specified"}</small></span><b>{row.status || "DRAFT"}</b></button>)}</div> : <p className="inventory-note">No purchase orders recorded.</p>}</InventoryPanel>
        </aside>
      </section>

      {notice ? <div className={`inventory-toast ${notice.tone}`}><strong>{notice.tone === "error" ? "Error" : notice.tone === "warning" ? "Attention" : "Saved"}</strong><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)}>x</button></div> : null}
      {loading ? <div className="inventory-loading">Loading inventory...</div> : null}

      {modal === "item" ? <InventoryModal title="Add Inventory Item" tone="green" onClose={() => setModal("")}><form className="inventory-form" onSubmit={submitItem}><Text label="Item name" value={itemForm.itemName} onChange={(v) => setItemForm((f) => ({ ...f, itemName: v }))} required /><Select label="Category" value={itemForm.category} onChange={(v) => setItemForm((f) => ({ ...f, category: v }))} options={["CONSUMABLES", "PHARMACEUTICALS", "EQUIPMENT", "REAGENTS", "STATIONERY", "KITCHEN"]} /><Select label="Store location" value={itemForm.storeLocation} onChange={(v) => setItemForm((f) => ({ ...f, storeLocation: v }))} options={storeNames.length ? storeNames : ["Main Medical Store"]} /><Text label="Unit type" value={itemForm.unitType} onChange={(v) => setItemForm((f) => ({ ...f, unitType: v }))} /><Text label="Current stock" type="number" value={itemForm.currentStock} onChange={(v) => setItemForm((f) => ({ ...f, currentStock: v }))} /><Text label="Reorder level" type="number" value={itemForm.minimumStockLevel} onChange={(v) => setItemForm((f) => ({ ...f, minimumStockLevel: v }))} /><Text label="Safety stock level" type="number" value={itemForm.safetyStockLevel} onChange={(v) => setItemForm((f) => ({ ...f, safetyStockLevel: v }))} /><Text label="Standard order quantity" type="number" value={itemForm.standardOrderQuantity} onChange={(v) => setItemForm((f) => ({ ...f, standardOrderQuantity: v }))} /><Text label="Unit cost" type="number" value={itemForm.unitCost} onChange={(v) => setItemForm((f) => ({ ...f, unitCost: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Item" /></form></InventoryModal> : null}
      {modal === "store" ? <InventoryModal title="Configure Store Location" tone="blue" onClose={() => setModal("")}><form className="inventory-form" onSubmit={submitStore}><Text label="Store name" value={storeForm.storeName} onChange={(v) => setStoreForm((f) => ({ ...f, storeName: v }))} required /><Select label="Store type" value={storeForm.storeType} onChange={(v) => setStoreForm((f) => ({ ...f, storeType: v }))} options={["MEDICAL", "PHARMACY", "WARD", "THEATRE", "KITCHEN", "STATIONERY"]} /><Text label="Manager" value={storeForm.managerName} onChange={(v) => setStoreForm((f) => ({ ...f, managerName: v }))} /><Text label="Location" value={storeForm.location} onChange={(v) => setStoreForm((f) => ({ ...f, location: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Store" /></form></InventoryModal> : null}
      {modal === "transfer" ? <InventoryModal title="Store Transfer Request" tone="blue" onClose={() => setModal("")}><form className="inventory-form" onSubmit={submitTransfer}><Text label="Item name" value={transferForm.itemName} onChange={(v) => setTransferForm((f) => ({ ...f, itemName: v }))} required /><Select label="From store" value={transferForm.fromStore} onChange={(v) => setTransferForm((f) => ({ ...f, fromStore: v }))} options={storeNames.length ? storeNames : ["Main Medical Store"]} /><Select label="To store" value={transferForm.toStore} onChange={(v) => setTransferForm((f) => ({ ...f, toStore: v }))} options={["", ...storeNames]} required /><Text label="Quantity" type="number" value={transferForm.quantity} onChange={(v) => setTransferForm((f) => ({ ...f, quantity: v }))} required /><Select label="Urgency" value={transferForm.urgency} onChange={(v) => setTransferForm((f) => ({ ...f, urgency: v }))} options={["NORMAL", "URGENT", "EMERGENCY"]} /><Area label="Notes" value={transferForm.notes} onChange={(v) => setTransferForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Request Transfer" /></form></InventoryModal> : null}
      {modal === "batch" ? <InventoryModal title="Receive Batch and Expiry" tone="green" onClose={() => setModal("")}><form className="inventory-form" onSubmit={submitBatch}><Select label="Item" value={batchForm.itemId} onChange={(v) => { const item = items.find((row) => row.id === v); setBatchForm((f) => ({ ...f, itemId: v, itemName: item?.itemName || item?.name || "", unitCost: String(item?.unitCost || f.unitCost) })); }} options={["", ...items.map((item) => item.id)]} labels={Object.fromEntries(items.map((item) => [item.id, `${item.itemName || item.name} (${item.storeLocation || "Main Medical Store"})`]))} required /><Text label="Item name" value={batchForm.itemName} onChange={(v) => setBatchForm((f) => ({ ...f, itemName: v }))} required /><Text label="Batch number" value={batchForm.batchNumber} onChange={(v) => setBatchForm((f) => ({ ...f, batchNumber: v }))} /><Text label="Expiry date" type="date" value={batchForm.expiryDate} onChange={(v) => setBatchForm((f) => ({ ...f, expiryDate: v }))} /><Text label="Quantity" type="number" value={batchForm.quantity} onChange={(v) => setBatchForm((f) => ({ ...f, quantity: v }))} required /><Text label="Unit cost" type="number" value={batchForm.unitCost} onChange={(v) => setBatchForm((f) => ({ ...f, unitCost: v }))} /><Text label="Supplier" value={batchForm.supplierName} onChange={(v) => setBatchForm((f) => ({ ...f, supplierName: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Confirm Receipt" /></form></InventoryModal> : null}
      {modal === "count" ? <InventoryModal title="Physical Stock Count" tone="orange" onClose={() => setModal("")}><form className="inventory-form" onSubmit={submitCount}><Select label="Store" value={countForm.storeName} onChange={(v) => setCountForm((f) => ({ ...f, storeName: v }))} options={["", ...storeNames]} required /><Text label="Item name" value={countForm.itemName} onChange={(v) => setCountForm((f) => ({ ...f, itemName: v }))} required /><Text label="System quantity" type="number" value={countForm.systemQuantity} onChange={(v) => setCountForm((f) => ({ ...f, systemQuantity: v }))} /><Text label="Physical quantity" type="number" value={countForm.physicalQuantity} onChange={(v) => setCountForm((f) => ({ ...f, physicalQuantity: v }))} required /><Text label="Unit cost" type="number" value={countForm.unitCost} onChange={(v) => setCountForm((f) => ({ ...f, unitCost: v }))} /><Text label="Counted by" value={countForm.countedBy} onChange={(v) => setCountForm((f) => ({ ...f, countedBy: v }))} /><Area label="Variance reason" value={countForm.varianceReason} onChange={(v) => setCountForm((f) => ({ ...f, varianceReason: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Count" /></form></InventoryModal> : null}
      {modal === "supplier" ? <InventoryModal title="Supplier Performance Scorecard" tone="purple" onClose={() => setModal("")}><form className="inventory-form" onSubmit={submitSupplier}><Text label="Supplier name" value={supplierForm.supplierName} onChange={(v) => setSupplierForm((f) => ({ ...f, supplierName: v }))} required /><Text label="On-time delivery %" type="number" value={supplierForm.onTimeDeliveryRate} onChange={(v) => setSupplierForm((f) => ({ ...f, onTimeDeliveryRate: v }))} /><Text label="Quality acceptance %" type="number" value={supplierForm.qualityPassRate} onChange={(v) => setSupplierForm((f) => ({ ...f, qualityPassRate: v }))} /><Text label="Price variance %" type="number" value={supplierForm.priceVariancePercent} onChange={(v) => setSupplierForm((f) => ({ ...f, priceVariancePercent: v }))} /><Area label="Recommendations" value={supplierForm.recommendations} onChange={(v) => setSupplierForm((f) => ({ ...f, recommendations: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Scorecard" /></form></InventoryModal> : null}
    </main>
  );
}

function InventoryPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="inventory-panel"><div className="inventory-panel-title"><h2>{title}</h2></div>{children}</section>;
}

function InventoryTable({ children }: { children: ReactNode }) {
  return <div className="inventory-table-wrap"><table className="inventory-table">{children}</table></div>;
}

function InventoryModal({ title, tone, onClose, children }: { title: string; tone: string; onClose: () => void; children: ReactNode }) {
  return <div className="inventory-modal-backdrop"><section className={`inventory-modal is-${tone}`}><header><div><span>Inventory</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close form"><X size={18} /></button></header>{children}</section></div>;
}

function Text({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="wide"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, onChange, options, labels = {}, required = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string>; required?: boolean }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} required={required}>{options.map((option) => <option value={option} key={option}>{option ? labels[option] || option : "Select"}</option>)}</select></label>;
}

function Footer({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return <footer><button type="button" onClick={onCancel}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : label}</button></footer>;
}
