import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CreditCard,
  FileText,
  PauseCircle,
  Plus,
  Printer,
  PlayCircle,
  RefreshCw,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";
import { useAppStore } from "../store/appStore";

const unwrapRows = (value: any) => {
  let current = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(current)) return current;
    if (!current || typeof current !== "object") return [];
    const next = current.data ?? current.items ?? current.rows ?? current.results ?? current.patients ?? current.medicines ?? current.catalog ?? current.records;
    if (next === undefined || next === current) return [];
    current = next;
  }
  if (Array.isArray(current)) return current;
  return [];
};

const unwrapObject = (value: any) => {
  let current = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return {};
    if (current.data && typeof current.data === "object" && !Array.isArray(current.data)) {
      current = current.data;
      continue;
    }
    return current;
  }
  return current && typeof current === "object" && !Array.isArray(current) ? current : {};
};

const money = (value: any) => `KES ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const itemName = (row: any) => row?.name || row?.brandName || row?.genericName || "Medicine";
const itemPrice = (row: any, catalog: any[]) => {
  const match = catalog.find((entry) =>
    [entry.genericName, entry.brandName, entry.code].filter(Boolean).some((value) =>
      `${row?.name || ""} ${row?.genericName || ""}`.toLowerCase().includes(String(value).toLowerCase()),
    ),
  );
  return Number(match?.sellingPrice || match?.unitPrice || row?.unitPrice || 0);
};
const prescriptionRequired = (row: any, catalog: any[]) => {
  const match = catalog.find((entry) =>
    [entry.genericName, entry.brandName, entry.code].filter(Boolean).some((value) =>
      `${row?.name || ""} ${row?.genericName || ""}`.toLowerCase().includes(String(value).toLowerCase()),
    ),
  );
  return Boolean(match?.prescriptionRequired || match?.requiresPrescription || match?.controlledStatus);
};
const parseReceipt = (row: any) => {
  const raw = row?.receipts?.[0]?.receiptUrl;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function PharmacyPosView() {
  const { facility, facilityLogo } = useAppStore();
  const [inventory, setInventory] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [reconciliation, setReconciliation] = useState<any>({});
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [suspendedSales, setSuspendedSales] = useState<any[]>([]);
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleForm, setSaleForm] = useState({
    customerType: "OUTPATIENT",
    patientId: "",
    customerName: "",
    customerPhone: "",
    staffId: "",
    paymentMethod: "CASH",
    mpesaCode: "",
    cashReceived: "",
    discountAmount: "",
    prescriptionId: "",
    notes: "",
  });
  const [cashForm, setCashForm] = useState({ date: new Date().toISOString().slice(0, 10), actualCash: "", notes: "" });
  const [receipt, setReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("hmis_pharmacy_pos_suspended_sales") || "[]");
      if (Array.isArray(stored)) setSuspendedSales(stored);
    } catch {
      setSuspendedSales([]);
    }
  }, []);

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 5200);
  };

  const load = async (targetDate = cashForm.date) => {
    setLoading(true);
    try {
      const safeGet = (label: string, request: Promise<any>, fallback: any) => request.catch((error) => ({
        data: fallback,
        __failed: true,
        __label: label,
        __status: error?.response?.status,
      }));
      const [iRes, cRes, sRes, pRes, tRes, rRes] = await Promise.all([
        safeGet("inventory", api.get("/pharmacy/inventory-batches"), []),
        safeGet("catalog", api.get("/pharmacy/catalog"), []),
        safeGet("staff", api.get("/pharmacy/staff"), []),
        safeGet("patients", api.get("/tenant/patients", { params: { limit: 800 } }), []),
        safeGet("transactions", api.get("/pharmacy/pos/transactions", { params: { date: targetDate } }), []),
        safeGet("reconciliation", api.get("/pharmacy/pos/reconciliation", { params: { date: targetDate } }), {}),
      ]);
      const failed = [iRes, cRes, sRes, pRes, tRes, rRes].filter((response: any) => response?.__failed);
      if (failed.length) {
        const details = failed.map((response: any) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ");
        setToast(`${failed.length} POS data source${failed.length === 1 ? "" : "s"} could not be loaded: ${details}.`);
      }
      setInventory(unwrapRows(iRes.data));
      setCatalog(unwrapRows(cRes.data));
      setStaff(unwrapRows(sRes.data));
      setPatients(unwrapRows(pRes.data));
      setTransactions(unwrapRows(tRes.data));
      const reconciliationPayload = unwrapObject(rRes.data);
      setReconciliation(reconciliationPayload);
      setCashForm((current) => ({ ...current, actualCash: current.actualCash || String(reconciliationPayload?.expectedCash || "") }));
    } catch (error: any) {
      setToast(error?.response?.data?.message || "POS data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(cashForm.date);
  }, []);

  useLiveRefresh(() => load(cashForm.date), { intervalMs: 45000 });

  const visibleInventory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory
      .filter((row) => Number(row.quantity || 0) > 0)
      .filter((row) => {
        const haystack = [row.name, row.genericName, row.batchNumber].join(" ").toLowerCase();
        return !q || haystack.includes(q);
      })
      .slice(0, 80);
  }, [inventory, search]);

  const visibleTransactions = useMemo(() => {
    const query = transactionSearch.trim().toLowerCase();
    if (!query) return transactions.slice(0, 100);
    return transactions.filter((row) => {
      const saleReceipt = parseReceipt(row);
      const items = Array.isArray(saleReceipt?.items) ? saleReceipt.items : [];
      const searchable = [
        row.id,
        row.paymentMethod,
        saleReceipt?.customerName,
        saleReceipt?.patientId,
        saleReceipt?.receiptNumber,
        ...items.flatMap((item: any) => [item.medicineName, item.prescriptionId]),
      ].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(query);
    }).slice(0, 100);
  }, [transactionSearch, transactions]);

  const cartTotal = useMemo(() => cart.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.unitPrice || 0), 0), [cart]);
  const discountAmount = Math.min(cartTotal, Math.max(0, Number(saleForm.discountAmount || 0)));
  const payableTotal = Math.max(0, cartTotal - discountAmount);
  const cashChange = Math.max(0, Number(saleForm.cashReceived || payableTotal) - payableTotal);
  const methodTotals = reconciliation?.totalsByPaymentMethod || {};
  const hospitalName = facility?.name || "MediLink General Hospital";
  const hospitalAddress = "P.O. Box 1000, Nairobi, Kenya";
  const hospitalPhone = "+254 700 000 000";
  const logoSrc = facilityLogo || "/MedilinkHMIS.png";

  const addToCart = (row: any) => {
    setSaleOpen(true);
    const unitPrice = itemPrice(row, catalog);
    const requiresPrescription = prescriptionRequired(row, catalog);
    setCart((current) => {
      const existing = current.find((item) => item.medicineId === row.id);
      if (existing) {
        return current.map((item) => item.medicineId === row.id ? { ...item, quantity: Math.min(Number(row.quantity || 1), Number(item.quantity || 0) + 1) } : item);
      }
      return [...current, { medicineId: row.id, name: itemName(row), batchNumber: row.batchNumber, stock: row.quantity, quantity: 1, unitPrice, requiresPrescription, prescriptionId: "" }];
    });
  };

  const updateCart = (medicineId: string, patch: any) => {
    setCart((current) => current.map((row) => row.medicineId === medicineId ? { ...row, ...patch } : row));
  };

  const changeReconciliationDate = (date: string) => {
    setCashForm((current) => ({ ...current, date, actualCash: "" }));
    void load(date);
  };

  const openTransactionReceipt = (row: any) => {
    const selectedReceipt = parseReceipt(row);
    if (!selectedReceipt) {
      setToast("This transaction does not have a printable receipt payload.");
      return;
    }
    setReceipt(selectedReceipt);
    setToast("Receipt loaded from the transaction table.");
  };

  const printReceipt = () => {
    if (!receipt || printing) return;
    setPrinting(true);
    const finish = () => setPrinting(false);
    window.addEventListener("afterprint", finish, { once: true });
    window.setTimeout(() => window.print(), 1400);
    window.setTimeout(finish, 7000);
  };

  const removeCart = (medicineId: string) => {
    setCart((current) => current.filter((row) => row.medicineId !== medicineId));
  };

  const suspendSale = () => {
    if (!cart.length) {
      setToast("Add at least one item before suspending the sale.");
      return;
    }
    const suspended = {
      id: `SUSP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      cart,
      saleForm,
    };
    const next = [suspended, ...suspendedSales].slice(0, 20);
    setSuspendedSales(next);
    window.localStorage.setItem("hmis_pharmacy_pos_suspended_sales", JSON.stringify(next));
    setCart([]);
    setToast("Sale suspended. The cart can be resumed from this terminal.");
  };

  const resumeSale = (suspended: any) => {
    setCart(Array.isArray(suspended?.cart) ? suspended.cart : []);
    if (suspended?.saleForm) setSaleForm(suspended.saleForm);
    const next = suspendedSales.filter((row) => row.id !== suspended.id);
    setSuspendedSales(next);
    window.localStorage.setItem("hmis_pharmacy_pos_suspended_sales", JSON.stringify(next));
    setToast("Suspended sale restored.");
  };

  const submitSale = (event: FormEvent) => {
    event.preventDefault();
    if (!cart.length) {
      setToast("Add at least one item before completing the sale.");
      return;
    }
    const missingPrescription = cart.find((row) => row.requiresPrescription && !(row.prescriptionId || saleForm.prescriptionId));
    if (missingPrescription) {
      setToast(`${missingPrescription.name} is prescription-only. Link a prescription or doctor's order first.`);
      return;
    }
    if (saleForm.paymentMethod === "CASH" && Number(saleForm.cashReceived || payableTotal) < payableTotal) {
      setToast("Cash received cannot be less than the sale total.");
      return;
    }
    setSaving("sale");
    api.post("/pharmacy/pos/sale", {
      ...saleForm,
      patientId: saleForm.patientId || undefined,
      cashReceived: Number(saleForm.cashReceived || payableTotal),
      items: cart.map((row) => ({
        medicineId: row.medicineId,
        quantity: Number(row.quantity),
        prescriptionId: row.prescriptionId || saleForm.prescriptionId,
      })),
    }).then((res) => {
      setReceipt(res.data?.receiptPayload || res.data?.receipt || res.data);
      setCart([]);
      setSaleOpen(false);
      setSaleForm({ customerType: "OUTPATIENT", patientId: "", customerName: "", customerPhone: "", staffId: "", paymentMethod: "CASH", mpesaCode: "", cashReceived: "", discountAmount: "", prescriptionId: "", notes: "" });
      setToast("POS sale completed, stock deducted, receipt issued, and transaction logged.");
      return load(cashForm.date);
    }).catch((error) => {
      setToast(error?.response?.data?.message || "POS sale failed.");
    }).finally(() => setSaving(""));
  };

  const reconcileCash = (event: FormEvent) => {
    event.preventDefault();
    setSaving("reconcile");
    api.post("/pharmacy/pos/reconciliation", {
      ...cashForm,
      expectedCash: reconciliation?.expectedCash || 0,
      actualCash: Number(cashForm.actualCash || 0),
    }).then(() => {
      setToast("Daily cash reconciliation saved and discrepancy checked.");
      return load(cashForm.date);
    }).catch((error) => {
      setToast(error?.response?.data?.message || "Cash reconciliation failed.");
    }).finally(() => setSaving(""));
  };

  return (
    <div className="nursing-view pharmacy-pos-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Pharmacy POS</h2>
          <p className="pv-subtitle">Retail pharmacy sales, salary deductions, receipt printing, and daily cash reconciliation.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="pos-btn pos-btn-primary" onClick={() => setSaleOpen(true)}><ShoppingCart size={15} /> New Sale</button>
          <button type="button" className="pos-btn pos-btn-info" onClick={printReceipt} disabled={!receipt || printing}><Printer size={15} /> {printing ? "Preparing..." : "Print Receipt"}</button>
          <button type="button" className="pos-btn pos-btn-neutral" onClick={() => void load(cashForm.date)}><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${/failed|prescription-only/i.test(notice) ? "error" : /reconciliation|salary/i.test(notice) ? "warning" : "success"}`} role="status" aria-live="polite">
          <div><strong>Pharmacy POS</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>x</button>
        </div>
      ) : null}

      {printing && receipt ? (
        <div className="pos-print-animation" role="status" aria-live="polite">
          <div className="pos-print-scene">
            <div className="pos-printer">
              <div className="pos-printer-top"><Printer size={30} /></div>
              <div className="pos-printer-slot" />
              <div className="pos-printer-body" />
              <div className="pos-paper"><strong>{hospitalName}</strong><span>{receipt.receiptNumber || "POS Receipt"}</span><b>{money(receipt.amount)}</b></div>
            </div>
            <strong className="pos-print-status">Printing receipt...</strong>
            <span className="pos-print-caption">Your receipt is being prepared for printing</span>
          </div>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        <article className="pv-stat-card" style={{ borderLeftColor: "#16a34a" }}><p className="pv-stat-label">Sales Today</p><p className="pv-stat-value">{money(Object.values(methodTotals).reduce((sum: number, value: any) => sum + Number(value || 0), 0))}</p></article>
        <article className="pv-stat-card" style={{ borderLeftColor: "#d97706" }}><p className="pv-stat-label">Expected Cash</p><p className="pv-stat-value">{money(reconciliation?.expectedCash || 0)}</p></article>
        <article className="pv-stat-card" style={{ borderLeftColor: "#2563eb" }}><p className="pv-stat-label">MPESA Sales</p><p className="pv-stat-value">{money(methodTotals.MPESA || 0)}</p></article>
        <article className="pv-stat-card" style={{ borderLeftColor: "#7c3aed" }}><p className="pv-stat-label">Salary Deduction</p><p className="pv-stat-value">{money(methodTotals.SALARY_DEDUCTION || 0)}</p></article>
      </div>

      <div className="pos-layout">
        <section className="nursing-worklist pos-stock-panel">
          <div className="pv-search-bar">
            <div className="pv-search-wrap"><Search /><input className="pv-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search or scan medicine, batch, generic name..." /></div>
          </div>
          <div className="pos-inventory-grid">
            {loading ? <p className="pv-empty">Loading stock...</p> : visibleInventory.map((row) => {
              const rx = prescriptionRequired(row, catalog);
              return (
                <button key={row.id} type="button" className="pos-stock-card" onClick={() => addToCart(row)}>
                  <strong>{itemName(row)}</strong>
                  <span>{row.batchNumber} | Stock {row.quantity}</span>
                  <em>{money(itemPrice(row, catalog))} {rx ? " | Rx required" : " | OTC"}</em>
                  <Plus size={16} />
                </button>
              );
            })}
            {!loading && !visibleInventory.length ? <p className="pv-empty">No stock item found.</p> : null}
          </div>
        </section>

        <section className="nursing-clinical-card pos-reconciliation-panel">
          <h3 className="form-title"><Banknote size={18} /> Daily Cash Reconciliation</h3>
          <form className="pos-form-grid pos-reconcile-form" onSubmit={reconcileCash}>
            <label><span>Date</span><input type="date" value={cashForm.date} onChange={(e) => changeReconciliationDate(e.target.value)} /></label>
            <label><span>Expected cash</span><input value={money(reconciliation?.expectedCash || 0)} readOnly /></label>
            <label><span>Physical cash counted</span><input type="number" value={cashForm.actualCash} onChange={(e) => setCashForm({ ...cashForm, actualCash: e.target.value })} required /></label>
            <label className="wide"><span>Notes</span><textarea value={cashForm.notes} onChange={(e) => setCashForm({ ...cashForm, notes: e.target.value })} /></label>
            <button type="submit" className="pos-submit-btn pos-reconcile-submit" disabled={Boolean(saving)}><Save size={15} /> Save Reconciliation</button>
          </form>
          {reconciliation?.latestReconciliation ? <div className="pos-discrepancy"><AlertTriangle size={15} /> Last discrepancy: {money(reconciliation.latestReconciliation.discrepancy)}</div> : null}
        </section>

        {saleOpen ? <div className="pos-sale-modal" role="dialog" aria-modal="true" aria-labelledby="pos-sale-title">
        <div className="pos-sale-modal-backdrop" onClick={() => setSaleOpen(false)} />
        <form className="pos-cart-panel pos-sale-modal-card" onSubmit={submitSale}>
          <div className="nursing-care-header">
            <div><span id="pos-sale-title">Retail Sale</span><strong>{cart.length} item(s) | {money(payableTotal)}</strong></div>
            <span className="pv-badge">{saleForm.paymentMethod}</span>
            <button type="button" className="pos-modal-close" onClick={() => setSaleOpen(false)} aria-label="Close sale form"><X size={18} /></button>
          </div>
          <p className="pos-form-intro">Capture customer, prescription, payment, and dispensing details.</p>
          <div className="pos-form-grid">
            <label><span>Customer type</span><select value={saleForm.customerType} onChange={(e) => setSaleForm({ ...saleForm, customerType: e.target.value })}><option>OUTPATIENT</option><option>VISITOR</option><option>STAFF</option><option>INSURANCE</option><option>WALK_IN</option></select></label>
            <label><span>Payment method</span><select value={saleForm.paymentMethod} onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}><option>CASH</option><option>MPESA</option><option>CARD</option><option>BANK_TRANSFER</option><option>CHEQUE</option><option>CREDIT</option><option>INSURANCE</option><option>PATIENT_ACCOUNT</option><option>VOUCHER</option><option>DEPOSIT</option><option>MIXED</option><option>SALARY_DEDUCTION</option></select></label>
            <label className="wide"><span>Registered patient (optional)</span><select value={saleForm.patientId} onChange={(e) => { const patient = patients.find((row) => row.id === e.target.value); setSaleForm({ ...saleForm, patientId: e.target.value, customerType: e.target.value ? "OUTPATIENT" : saleForm.customerType, customerName: patient ? [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ") : saleForm.customerName, customerPhone: patient?.phone || patient?.phonePrimary || saleForm.customerPhone }); }}><option value="">Visitor / walk-in customer</option>{patients.slice(0, 800).map((row) => <option key={row.id} value={row.id}>{[row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ") || "Patient"} · {row.patientCode || row.mrn || row.id}</option>)}</select></label>
            <label><span>Customer name</span><input value={saleForm.customerName} onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })} /></label>
            <label><span>Phone</span><input value={saleForm.customerPhone} onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })} /></label>
            {saleForm.paymentMethod === "SALARY_DEDUCTION" ? <label className="wide"><span>Staff member</span><select value={saleForm.staffId} onChange={(e) => setSaleForm({ ...saleForm, staffId: e.target.value })} required><option value="">Select staff</option>{staff.map((row) => <option key={row.id} value={row.id}>{row.firstName} {row.lastName} {row.licenseNumber ? `(${row.licenseNumber})` : ""}</option>)}</select></label> : null}
            {saleForm.paymentMethod === "MPESA" ? <label className="wide"><span>MPESA confirmation code</span><input value={saleForm.mpesaCode} onChange={(e) => setSaleForm({ ...saleForm, mpesaCode: e.target.value })} required /></label> : null}
            {saleForm.paymentMethod === "CASH" ? <label><span>Cash received</span><input type="number" value={saleForm.cashReceived} onChange={(e) => setSaleForm({ ...saleForm, cashReceived: e.target.value })} placeholder={String(cartTotal)} /></label> : null}
            <label><span>Approved discount</span><input type="number" min="0" max={cartTotal} value={saleForm.discountAmount} onChange={(e) => setSaleForm({ ...saleForm, discountAmount: e.target.value })} placeholder="0.00" /></label>
            <label><span>Linked prescription/order</span><input value={saleForm.prescriptionId} onChange={(e) => setSaleForm({ ...saleForm, prescriptionId: e.target.value })} placeholder="Required for Rx-only drugs" /></label>
          </div>
          <div className="pos-cart-list">
            {cart.map((row) => (
              <div key={row.medicineId} className="pos-cart-item">
                <div><strong>{row.name}</strong><span>{row.batchNumber} | {money(row.unitPrice)} {row.requiresPrescription ? "| Rx" : "| OTC"}</span></div>
                <input type="number" min="1" max={row.stock} value={row.quantity} onChange={(e) => {
                  const nextQuantity = Math.min(Number(row.stock || 1), Math.max(1, Number(e.target.value || 1)));
                  updateCart(row.medicineId, { quantity: nextQuantity });
                }} />
                {row.requiresPrescription ? <input value={row.prescriptionId} onChange={(e) => updateCart(row.medicineId, { prescriptionId: e.target.value })} placeholder="Rx/order ID" /> : null}
                <button type="button" onClick={() => removeCart(row.medicineId)}><Trash2 size={15} /></button>
              </div>
            ))}
            {!cart.length ? <p className="pv-empty">Cart is empty. Add medicine from the stock list.</p> : null}
          </div>
          <div className="pos-total-strip">
            <span>Total <strong>{money(payableTotal)}</strong>{discountAmount ? <small> · {money(discountAmount)} discount</small> : null}</span>
            {saleForm.paymentMethod === "CASH" ? <span>Change <strong>{money(cashChange)}</strong></span> : null}
          </div>
          <div className="pos-cart-actions">
            <button type="button" className="pos-secondary-btn" onClick={suspendSale} disabled={!cart.length || Boolean(saving)}>
              <PauseCircle size={15} /> Suspend Sale
            </button>
            {suspendedSales.length ? (
              <details className="pos-suspended-sales">
                <summary><PlayCircle size={15} /> Resume ({suspendedSales.length})</summary>
                <div className="pos-suspended-list">
                  {suspendedSales.map((row) => (
                    <button type="button" key={row.id} onClick={() => resumeSale(row)}>
                      {row.id} · {row.cart?.length || 0} item(s) · {new Date(row.createdAt).toLocaleTimeString()}
                    </button>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
          <button type="submit" className="pos-submit-btn" disabled={Boolean(saving)}><ShoppingCart size={16} /> {saving === "sale" ? "Completing..." : "Complete Sale"}</button>
        </form>
        </div> : null}
      </div>

      <div className="pos-bottom-grid">
        <section className="nursing-clinical-card pos-receipt-card">
          <h3 className="form-title"><FileText size={18} /> Receipt</h3>
          {receipt ? (
            <div className="pos-receipt">
              <div className="pos-receipt-head">
                <img src={logoSrc} alt="Hospital logo" />
                <div>
                  <strong>{hospitalName}</strong>
                  <span>{hospitalAddress}</span>
                  <span>{hospitalPhone}</span>
                </div>
              </div>
              <div className="pos-receipt-meta">
                <span>Receipt</span><strong>{receipt.receiptNumber || "POS Receipt"}</strong>
                <span>Date</span><strong>{receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleString() : new Date().toLocaleString()}</strong>
                <span>Customer</span><strong>{receipt.customerName || receipt.customerType || "Walk-in customer"}</strong>
                <span>Payment</span><strong>{receipt.paymentMethod || saleForm.paymentMethod}</strong>
              </div>
              <div className="pos-receipt-lines">
                {(receipt.items || []).map((row: any) => (
                  <div key={`${row.medicineId}-${row.batchNumber}`}>
                    <span>{row.medicineName}<small>{row.batchNumber}</small></span>
                    <strong>{row.quantity} x {money(row.unitPrice)}</strong>
                    <b>{money(row.lineTotal)}</b>
                  </div>
                ))}
              </div>
              <div className="pos-receipt-total">
                <span>Total Paid</span>
                <strong>{money(receipt.amount)}</strong>
              </div>
              <p className="pos-receipt-footer">Thank you for choosing {hospitalName}. Keep this receipt for returns and reconciliation.</p>
            </div>
          ) : <p className="pv-empty">Receipt appears after a sale.</p>}
        </section>
        <section className="nursing-clinical-card">
          <div className="pos-table-heading"><h3 className="form-title"><CreditCard size={18} /> Today Transactions</h3><input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Search patient, drug, prescription..." /></div>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead><tr><th>Time</th><th>Patient / Customer</th><th>Drugs bought</th><th>Prescription</th><th>Payment</th><th>Total cost</th><th>Action</th></tr></thead>
              <tbody>
                {visibleTransactions.map((row) => {
                  const saleReceipt = parseReceipt(row);
                  const items = Array.isArray(saleReceipt?.items) ? saleReceipt.items : [];
                  const prescriptionIds = items.map((item: any) => item.prescriptionId).filter(Boolean);
                  const customer = saleReceipt?.customerName || saleReceipt?.patientId || saleReceipt?.customerType || "Walk-in customer";
                  return (
                    <tr key={row.id}>
                      <td>{new Date(row.transactionDate || row.createdAt).toLocaleTimeString()}</td>
                      <td><strong>{customer}</strong>{saleReceipt?.patientId ? <small className="pos-table-subtext">MRN/ID: {saleReceipt.patientId}</small> : null}</td>
                      <td>{items.length ? <span className="pos-drug-list">{items.map((item: any) => `${item.medicineName || "Medicine"} ×${item.quantity}`).join(", ")}</span> : "—"}</td>
                      <td>{prescriptionIds.length ? prescriptionIds.join(", ") : "OTC / None"}</td>
                      <td>{row.paymentMethod || saleReceipt?.paymentMethod || "—"}</td>
                      <td><strong>{money(row.amount || saleReceipt?.amount)}</strong>{saleReceipt?.discountAmount ? <small className="pos-table-subtext">Discount {money(saleReceipt.discountAmount)}</small> : null}</td>
                      <td><button type="button" className="pv-link-btn" onClick={() => openTransactionReceipt(row)}>Receipt</button></td>
                    </tr>
                  );
                })}
                {!visibleTransactions.length ? <tr><td colSpan={7} className="pv-empty">{transactionSearch ? "No transactions match your search." : "No POS transactions for this date."}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
