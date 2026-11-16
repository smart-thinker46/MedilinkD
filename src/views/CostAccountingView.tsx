// Ported from Medilink-Frontend/src/app/cost-accounting/page.tsx for desktop parity.
import { FormEvent, ReactNode, useEffect, useId, useMemo, useState } from "react";
import {
  Calculator,
  ChartNoAxesColumnIncreasing,
  DollarSign,
  Factory,
  GitBranch,
  Layers,
  RefreshCw,
  Search,
  TrendingUp,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const money = (value: unknown) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

const unwrapRows = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const unwrapObject = (value: any) => value?.data && !Array.isArray(value.data) ? value.data : value || {};

const pct = (value: unknown) => `${Number(value || 0).toFixed(1)}%`;

const today = new Date().toISOString().slice(0, 10);

const emptyCostCenter = {
  code: "",
  name: "",
  departmentName: "",
  type: "CLINICAL",
  description: "",
};

const emptyCostCategory = {
  code: "",
  name: "",
  classification: "DIRECT",
  description: "",
};

const emptyCostEntry = {
  periodDate: today,
  costCenterCode: "",
  departmentName: "",
  serviceCode: "",
  serviceName: "",
  costCategoryId: "",
  classification: "DIRECT",
  quantity: "1",
  unitCost: "",
  amount: "",
  sourceModule: "INVENTORY",
  notes: "",
};

const emptyOverhead = {
  periodDate: today,
  sourceCostCenterCode: "ADMIN",
  targetCostCenterCode: "",
  departmentName: "",
  driverType: "SQUARE_FOOTAGE",
  driverValue: "",
  allocationAmount: "",
  notes: "",
};

const emptyServiceCost = {
  periodDate: today,
  departmentName: "",
  costCenterId: "",
  serviceCode: "",
  serviceName: "",
  volumeCount: "",
  billedAmount: "",
  directCost: "",
  allocatedOverhead: "",
  notes: "",
};

const emptyDepartmentReport = {
  periodStart: today,
  periodEnd: today,
  departmentName: "",
  revenueAmount: "",
  directCost: "",
  allocatedOverhead: "",
  casesCount: "",
  notes: "",
};

const emptyPricing = {
  departmentName: "",
  serviceCode: "",
  serviceName: "",
  currentPrice: "",
  recommendedPrice: "",
  expectedMarginImpactPercent: "",
  confidenceScore: "80",
  reason: "",
};

export default function CostAccountingView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [costCategories, setCostCategories] = useState<any[]>([]);
  const [costEntries, setCostEntries] = useState<any[]>([]);
  const [overheads, setOverheads] = useState<any[]>([]);
  const [serviceCosts, setServiceCosts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [modal, setModal] = useState<"center" | "category" | "entry" | "overhead" | "service" | "department" | "pricing" | "">("");
  const [centerForm, setCenterForm] = useState(emptyCostCenter);
  const [categoryForm, setCategoryForm] = useState(emptyCostCategory);
  const [entryForm, setEntryForm] = useState(emptyCostEntry);
  const [overheadForm, setOverheadForm] = useState(emptyOverhead);
  const [serviceForm, setServiceForm] = useState(emptyServiceCost);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentReport);
  const [pricingForm, setPricingForm] = useState(emptyPricing);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "success" ? 2600 : 4200);
  };

  const params = () => ({
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const p = params();
      const results = await Promise.allSettled([
        api.get("/cost-accounting/dashboard", { params: p }),
        api.get("/cost-accounting/kpis", { params: p }),
        api.get("/cost-accounting/cost-centers"),
        api.get("/cost-accounting/cost-categories"),
        api.get("/cost-accounting/cost-entries", { params: { ...p, limit: 200 } }),
        api.get("/cost-accounting/overhead-allocations", { params: { ...p, limit: 200 } }),
        api.get("/cost-accounting/service-costs", { params: { ...p, limit: 300 } }),
        api.get("/cost-accounting/department-profitability", { params: { ...p, limit: 200 } }),
        api.get("/cost-accounting/pricing-recommendations", { params: { limit: 100 } }),
      ]);
      const labels = ["dashboard", "KPIs", "cost centres", "cost categories", "cost entries", "overhead allocations", "service costs", "department profitability", "pricing recommendations"];
      const [dashRes, kpiRes, centersRes, categoriesRes, entriesRes, overheadRes, servicesRes, deptRes, pricingRes] = results;
      if (dashRes.status === "fulfilled") setDashboard(unwrapObject(dashRes.value.data));
      if (kpiRes.status === "fulfilled") setKpis(unwrapObject(kpiRes.value.data));
      if (centersRes.status === "fulfilled") setCostCenters(unwrapRows(centersRes.value.data));
      if (categoriesRes.status === "fulfilled") setCostCategories(unwrapRows(categoriesRes.value.data));
      if (entriesRes.status === "fulfilled") setCostEntries(unwrapRows(entriesRes.value.data));
      if (overheadRes.status === "fulfilled") setOverheads(unwrapRows(overheadRes.value.data));
      if (servicesRes.status === "fulfilled") setServiceCosts(unwrapRows(servicesRes.value.data));
      if (deptRes.status === "fulfilled") setDepartments(unwrapRows(deptRes.value.data));
      if (pricingRes.status === "fulfilled") setPricing(unwrapRows(pricingRes.value.data));
      const failures = results.map((result: any, index) => result.status === "rejected" ? `${labels[index]}${result.reason?.response?.status ? ` (${result.reason.response.status})` : ""}` : "").filter(Boolean);
      setSourceErrors(failures);
      if (failures.length === results.length) showNotice("Cost accounting data could not be loaded. Check your connection or permissions.", "error");
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Cost accounting data could not be loaded."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [fromDate, toDate]);
  useLiveRefresh(() => loadData(), { intervalMs: 60000 });

  const departmentOptions = useMemo(() => {
    const names = new Set<string>();
    [...departments, ...serviceCosts, ...costEntries, ...overheads].forEach((row) => {
      const name = String(row?.departmentName || "").trim();
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [departments, serviceCosts, costEntries, overheads]);

  const matchesFilters = (row: any) => {
    const q = search.trim().toLowerCase();
    const hay = [
      row?.departmentName,
      row?.serviceName,
      row?.serviceCode,
      row?.costCenterCode,
      row?.targetCostCenterCode,
      row?.name,
      row?.code,
    ]
      .join(" ")
      .toLowerCase();
    const dept = String(row?.departmentName || "").trim();
    return (!q || hay.includes(q)) && (departmentFilter === "ALL" || dept === departmentFilter);
  };

  const filteredServiceCosts = serviceCosts.filter(matchesFilters);
  const filteredDepartments = departments.filter(matchesFilters);
  const filteredEntries = costEntries.filter(matchesFilters);
  const filteredOverheads = overheads.filter(matchesFilters);
  const filteredCostCenters = costCenters.filter(matchesFilters);
  const hasActiveFilter = Boolean(search.trim() || departmentFilter !== "ALL");

  const stats = [
    { label: "True Cost", value: money(kpis?.totalCost), color: "#2563eb", icon: <Calculator size={20} /> },
    { label: "Revenue", value: money(kpis?.totalRevenue), color: "#16a34a", icon: <DollarSign size={20} /> },
    { label: "Gross Margin", value: money(kpis?.grossMarginAmount), color: Number(kpis?.grossMarginAmount || 0) >= 0 ? "#059669" : "#dc2626", icon: <TrendingUp size={20} /> },
    { label: "Margin %", value: pct(kpis?.grossMarginPercent), color: Number(kpis?.grossMarginPercent || 0) >= 15 ? "#059669" : "#dc2626", icon: <ChartNoAxesColumnIncreasing size={20} /> },
    { label: "Overhead", value: money(kpis?.overheadCost), color: "#7c3aed", icon: <GitBranch size={20} /> },
    { label: "Cost / Case", value: money(kpis?.costPerCase), color: "#d97706", icon: <Factory size={20} /> },
  ];

  const postForm = async (endpoint: string, body: any, success: string, afterSuccess?: () => void) => {
    setSaving(true);
    try {
      await api.post(endpoint, body);
      showNotice(success);
      afterSuccess?.();
      setModal("");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Save failed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitCenter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void postForm("/cost-accounting/cost-centers", centerForm, "Cost centre saved.", () => setCenterForm(emptyCostCenter));
  };

  const submitCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void postForm("/cost-accounting/cost-categories", categoryForm, "Cost category saved.", () => setCategoryForm(emptyCostCategory));
  };

  const submitEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const quantity = Number(entryForm.quantity || 1);
    const unitCost = Number(entryForm.unitCost || 0);
    const amount = Number(entryForm.amount || quantity * unitCost);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0 || !Number.isFinite(amount) || amount <= 0) {
      showNotice("Quantity, unit cost, and amount must be valid positive values.", "error");
      return;
    }
    void postForm(
      "/cost-accounting/cost-entries",
      { ...entryForm, quantity, unitCost, amount },
      "Direct/material/labour cost entry saved.",
      () => setEntryForm(emptyCostEntry),
    );
  };

  const submitOverhead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const driverValue = Number(overheadForm.driverValue || 0);
    const allocationAmount = Number(overheadForm.allocationAmount || 0);
    if (!Number.isFinite(driverValue) || driverValue < 0 || !Number.isFinite(allocationAmount) || allocationAmount <= 0) {
      showNotice("Driver value must be zero or greater and allocation amount must be positive.", "error");
      return;
    }
    void postForm(
      "/cost-accounting/overhead-allocations",
      {
        ...overheadForm,
        driverValue,
        allocationAmount,
      },
      "Overhead allocation posted.",
      () => setOverheadForm(emptyOverhead),
    );
  };

  const submitService = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const volumeCount = Number(serviceForm.volumeCount || 0);
    const billedAmount = Number(serviceForm.billedAmount || 0);
    const directCost = Number(serviceForm.directCost || 0);
    const allocatedOverhead = Number(serviceForm.allocatedOverhead || 0);
    if (!Number.isFinite(volumeCount) || volumeCount <= 0 || [billedAmount, directCost, allocatedOverhead].some((value) => !Number.isFinite(value) || value < 0)) {
      showNotice("Volume must be positive and cost values cannot be negative.", "error");
      return;
    }
    void postForm(
      "/cost-accounting/service-costs",
      {
        ...serviceForm,
        volumeCount,
        billedAmount,
        directCost,
        allocatedOverhead,
      },
      "Activity-based service cost saved.",
      () => setServiceForm(emptyServiceCost),
    );
  };

  const submitDepartment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (departmentForm.periodStart > departmentForm.periodEnd) {
      showNotice("Period end must be on or after the period start.", "error");
      return;
    }
    void postForm(
      "/cost-accounting/department-profitability",
      {
        ...departmentForm,
        revenueAmount: Number(departmentForm.revenueAmount || 0),
        directCost: Number(departmentForm.directCost || 0),
        allocatedOverhead: Number(departmentForm.allocatedOverhead || 0),
        casesCount: Number(departmentForm.casesCount || 0),
      },
      "Department cost-centre report saved.",
      () => setDepartmentForm(emptyDepartmentReport),
    );
  };

  const submitPricing = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentPrice = Number(pricingForm.currentPrice || 0);
    const recommendedPrice = Number(pricingForm.recommendedPrice || 0);
    const confidenceScore = Number(pricingForm.confidenceScore || 0);
    if ([currentPrice, recommendedPrice].some((value) => !Number.isFinite(value) || value < 0) || confidenceScore < 0 || confidenceScore > 100) {
      showNotice("Prices must be zero or greater and confidence must be between 0 and 100.", "error");
      return;
    }
    void postForm(
      "/cost-accounting/pricing-recommendations",
      {
        ...pricingForm,
        currentPrice,
        recommendedPrice,
        expectedMarginImpactPercent: Number(pricingForm.expectedMarginImpactPercent || 0),
        confidenceScore,
      },
      "Pricing recommendation saved.",
      () => setPricingForm(emptyPricing),
    );
  };

  const selectCostRecord = (row: any) => {
    setSelected(row);
    window.dispatchEvent(new CustomEvent("hmis:cost-table-collapse"));
  };

  return (
    <main className="cost-page">
      {sourceErrors.length ? <div className="cost-source-warning" role="status"><strong>Some costing sources need attention</strong><span>{sourceErrors.join(", ")}. Available costing data remains visible; refresh after checking permissions or connectivity.</span></div> : null}
      <header className="cost-header">
        <div>
          <h1>Cost Accounting</h1>
          <p>Activity-based costing, department cost centres, overhead allocation, and service profitability analysis.</p>
        </div>
        <div className="cost-actions">
          <button className="cost-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="cost-btn green" type="button" onClick={() => setModal("service")}><Calculator size={17} /> ABC Service Cost</button>
          <button className="cost-btn blue" type="button" onClick={() => setModal("overhead")}><GitBranch size={17} /> Allocate Overhead</button>
          <button className="cost-btn purple" type="button" onClick={() => setModal("department")}><Layers size={17} /> Department Report</button>
          <button className="cost-btn teal" type="button" onClick={() => setModal("category")}><GitBranch size={17} /> Cost Category</button>
        </div>
      </header>

      <section className="cost-stats">
        {stats.map((stat) => (
          <article className="cost-stat" style={{ borderLeftColor: stat.color }} key={stat.label}>
            <div><span>{stat.label}</span><strong>{stat.value}</strong></div>
            <i style={{ color: stat.color }}>{stat.icon}</i>
          </article>
        ))}
      </section>

      <section className="cost-filter-panel">
        <label className="cost-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search department, service, cost centre..." /></label>
        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option value="ALL">All departments</option>
          {departmentOptions.map((name) => <option value={name} key={name}>{name}</option>)}
        </select>
      </section>

      <section className="cost-grid">
        <div className="cost-main">
          <CostPanel title="Service Profitability Analysis" action={<button onClick={() => setModal("service")} type="button">New ABC Cost</button>}>
            <CostTable>
              <thead><tr><th>Service</th><th>Department</th><th>Revenue</th><th>Direct Cost</th><th>Overhead</th><th>Total Cost</th><th>Margin</th></tr></thead>
              <tbody>
                {filteredServiceCosts.length ? filteredServiceCosts.map((row) => (
                  <tr key={row.serviceCostId || `${row.serviceCode}-${row.periodDate}`} className={selected === row ? "is-cost-selected-row" : ""} onClick={() => selectCostRecord(row)}>
                    <td><strong>{row.serviceName || row.serviceCode}</strong><small>{row.serviceCode || "No code"} · {Number(row.volumeCount || 0)} unit(s)</small></td>
                    <td>{row.departmentName || "-"}</td>
                    <td>{money(row.billedAmount)}</td>
                    <td>{money(row.directCost)}</td>
                    <td>{money(row.allocatedOverhead)}</td>
                    <td>{money(row.totalCost)}</td>
                    <td className={Number(row.marginAmount || 0) < 0 ? "danger" : "ok"}>{money(row.marginAmount)}<small>{pct(row.marginPercent)}</small></td>
                  </tr>
                )) : <tr><td colSpan={7} className="cost-empty">No service profitability records found.</td></tr>}
              </tbody>
            </CostTable>
          </CostPanel>

          <CostPanel title="Department Cost Centre Reporting" action={<button onClick={() => setModal("department")} type="button">New Report</button>}>
            <CostTable>
              <thead><tr><th>Department</th><th>Revenue</th><th>Direct</th><th>Overhead</th><th>Total Cost</th><th>Margin</th><th>Cases</th></tr></thead>
              <tbody>
                {(filteredDepartments.length ? filteredDepartments : hasActiveFilter ? [] : dashboard?.departments || []).length ? (filteredDepartments.length ? filteredDepartments : dashboard.departments).map((row: any) => (
                    <tr key={row.departmentProfitabilityId || row.departmentName} className={selected === row ? "is-cost-selected-row" : ""} onClick={() => selectCostRecord(row)}>
                    <td><strong>{row.departmentName || "-"}</strong><small>{row.costCenterId || row.departmentId || "Cost centre"}</small></td>
                    <td>{money(row.revenueAmount ?? row.revenue)}</td>
                    <td>{money(row.directCost)}</td>
                    <td>{money(row.allocatedOverhead ?? row.overhead)}</td>
                    <td>{money(row.totalCost)}</td>
                    <td className={Number(row.netMarginAmount || 0) < 0 ? "danger" : "ok"}>{money(row.netMarginAmount)}<small>{pct(row.netMarginPercent)}</small></td>
                    <td>{row.casesCount ?? row.cases ?? 0}</td>
                  </tr>
                )) : <tr><td colSpan={7} className="cost-empty">No department profitability reports found.</td></tr>}
              </tbody>
            </CostTable>
          </CostPanel>
        </div>

        <aside className="cost-side">
          <section className="cost-selected">
            <span>Selected Record</span>
            <h2>{selected?.serviceName || selected?.departmentName || selected?.name || "No record selected"}</h2>
            <dl>
              <div><dt>Revenue</dt><dd>{money(selected?.billedAmount ?? selected?.revenueAmount ?? selected?.revenue)}</dd></div>
              <div><dt>Cost</dt><dd>{money(selected?.totalCost ?? selected?.amount)}</dd></div>
              <div><dt>Margin</dt><dd>{pct(selected?.marginPercent ?? selected?.netMarginPercent)}</dd></div>
            </dl>
          </section>

          <CostPanel title="Overhead Allocation Engine" action={<button onClick={() => setModal("overhead")} type="button">Allocate</button>}>
            <div className="cost-list">
              {filteredOverheads.length ? filteredOverheads.slice(0, 6).map((row) => (
                  <button type="button" key={row.overheadAllocationId || row.createdAt} onClick={() => setSelected(row)}>
                  <span><strong>{row.driverType}</strong><small>{row.sourceCostCenterCode || "OVERHEAD"} to {row.targetCostCenterCode || row.departmentName || "department"}</small></span>
                  <b>{money(row.allocationAmount)}</b>
                </button>
              )) : <p>No overhead allocations in this period.</p>}
            </div>
          </CostPanel>

          <CostPanel title="Cost Centres and Direct Cost Entries" action={<button onClick={() => setModal("center")} type="button">Cost Centre</button>}>
            <div className="cost-list">
              {filteredCostCenters.slice(0, 5).map((row) => (
                <button type="button" key={row.costCenterId || row.code} onClick={() => setSelected(row)}>
                  <span><strong>{row.name}</strong><small>{row.code} · {row.type}</small></span>
                  <b>{row.status}</b>
                </button>
              ))}
              {filteredEntries.slice(0, 5).map((row) => (
                <button type="button" key={row.costEntryId || row.createdAt} onClick={() => setSelected(row)}>
                  <span><strong>{row.serviceName || row.departmentName || row.costCenterCode || "Cost entry"}</strong><small>{row.classification} · {row.sourceModule || "MANUAL"}</small></span>
                  <b>{money(row.amount)}</b>
                </button>
              ))}
              <button type="button" onClick={() => setModal("entry")}><span><strong>Record direct/material cost</strong><small>Labour, reagents, drugs, disposables, depreciation.</small></span><b>+</b></button>
            </div>
          </CostPanel>

          <CostPanel title="Pricing Review" action={<button onClick={() => setModal("pricing")} type="button">Recommend</button>}>
            <div className="cost-list">
              {pricing.length ? pricing.slice(0, 5).map((row) => (
                <button type="button" key={row.pricingRecommendationId || row.serviceCode} onClick={() => setSelected(row)}>
                  <span><strong>{row.serviceName || row.serviceCode}</strong><small>{money(row.currentPrice)} to {money(row.recommendedPrice)}</small></span>
                  <b>{row.status}</b>
                </button>
              )) : <p>No pricing recommendations yet.</p>}
            </div>
          </CostPanel>
        </aside>
      </section>

      {notice ? <div className={`cost-toast ${notice.tone}`}><strong>{notice.tone === "error" ? "Error" : notice.tone === "warning" ? "Attention" : "Saved"}</strong><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)}>x</button></div> : null}
      {loading ? <div className="cost-loading">Loading cost accounting...</div> : null}

      {modal === "center" ? <CostModal title="Cost Centre" tone="green" onClose={() => setModal("")}><form className="cost-form" onSubmit={submitCenter}><Text label="Code" value={centerForm.code} onChange={(v) => setCenterForm((f) => ({ ...f, code: v }))} required /><Text label="Name" value={centerForm.name} onChange={(v) => setCenterForm((f) => ({ ...f, name: v }))} required /><Text label="Department" value={centerForm.departmentName} onChange={(v) => setCenterForm((f) => ({ ...f, departmentName: v }))} /><Select label="Type" value={centerForm.type} onChange={(v) => setCenterForm((f) => ({ ...f, type: v }))} options={["CLINICAL", "SUPPORT", "ADMIN", "OVERHEAD"]} /><Area label="Description" value={centerForm.description} onChange={(v) => setCenterForm((f) => ({ ...f, description: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Cost Centre" /></form></CostModal> : null}

      {modal === "category" ? <CostModal title="Cost Category" tone="teal" onClose={() => setModal("")}><form className="cost-form" onSubmit={submitCategory}><Text label="Category code" value={categoryForm.code} onChange={(v) => setCategoryForm((f) => ({ ...f, code: v }))} required /><Text label="Category name" value={categoryForm.name} onChange={(v) => setCategoryForm((f) => ({ ...f, name: v }))} required /><Select label="Classification" value={categoryForm.classification} onChange={(v) => setCategoryForm((f) => ({ ...f, classification: v }))} options={["DIRECT", "INDIRECT", "CAPITAL", "NON_ALLOCABLE"]} /><Area label="Description" value={categoryForm.description} onChange={(v) => setCategoryForm((f) => ({ ...f, description: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Cost Category" /></form></CostModal> : null}

      {modal === "entry" ? <CostModal title="Direct Cost Entry" tone="orange" onClose={() => setModal("")}><form className="cost-form" onSubmit={submitEntry}><Text label="Period date" type="date" value={entryForm.periodDate} onChange={(v) => setEntryForm((f) => ({ ...f, periodDate: v }))} required /><Text label="Cost centre code" value={entryForm.costCenterCode} onChange={(v) => setEntryForm((f) => ({ ...f, costCenterCode: v }))} /><Text label="Department" value={entryForm.departmentName} onChange={(v) => setEntryForm((f) => ({ ...f, departmentName: v }))} /><Text label="Service code" value={entryForm.serviceCode} onChange={(v) => setEntryForm((f) => ({ ...f, serviceCode: v }))} /><Text label="Service name" value={entryForm.serviceName} onChange={(v) => setEntryForm((f) => ({ ...f, serviceName: v }))} /><Select label="Cost category" value={entryForm.costCategoryId} onChange={(v) => setEntryForm((f) => ({ ...f, costCategoryId: v }))} options={["", ...costCategories.map((category) => String(category.code || category.id || ""))].filter(Boolean)} /><Select label="Classification" value={entryForm.classification} onChange={(v) => setEntryForm((f) => ({ ...f, classification: v }))} options={["DIRECT", "INDIRECT", "CAPITAL"]} /><Text label="Quantity" type="number" value={entryForm.quantity} onChange={(v) => setEntryForm((f) => ({ ...f, quantity: v }))} /><Text label="Unit cost" type="number" value={entryForm.unitCost} onChange={(v) => setEntryForm((f) => ({ ...f, unitCost: v }))} /><Text label="Amount" type="number" value={entryForm.amount} onChange={(v) => setEntryForm((f) => ({ ...f, amount: v }))} /><Select label="Source" value={entryForm.sourceModule} onChange={(v) => setEntryForm((f) => ({ ...f, sourceModule: v }))} options={["INVENTORY", "PAYROLL", "PROCUREMENT", "BILLING", "MANUAL"]} /><Area label="Notes" value={entryForm.notes} onChange={(v) => setEntryForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Cost Entry" /></form></CostModal> : null}

      {modal === "overhead" ? <CostModal title="Overhead Allocation" tone="blue" onClose={() => setModal("")}><form className="cost-form" onSubmit={submitOverhead}><Text label="Period date" type="date" value={overheadForm.periodDate} onChange={(v) => setOverheadForm((f) => ({ ...f, periodDate: v }))} required /><Text label="Source cost centre" value={overheadForm.sourceCostCenterCode} onChange={(v) => setOverheadForm((f) => ({ ...f, sourceCostCenterCode: v }))} /><Text label="Target cost centre" value={overheadForm.targetCostCenterCode} onChange={(v) => setOverheadForm((f) => ({ ...f, targetCostCenterCode: v }))} /><Text label="Department" value={overheadForm.departmentName} onChange={(v) => setOverheadForm((f) => ({ ...f, departmentName: v }))} /><Select label="Driver type" value={overheadForm.driverType} onChange={(v) => setOverheadForm((f) => ({ ...f, driverType: v }))} options={["SQUARE_FOOTAGE", "HEADCOUNT", "REVENUE", "BLENDED", "MANUAL"]} /><Text label="Driver value" type="number" value={overheadForm.driverValue} onChange={(v) => setOverheadForm((f) => ({ ...f, driverValue: v }))} /><Text label="Allocation amount" type="number" value={overheadForm.allocationAmount} onChange={(v) => setOverheadForm((f) => ({ ...f, allocationAmount: v }))} required /><Area label="Notes" value={overheadForm.notes} onChange={(v) => setOverheadForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Post Allocation" /></form></CostModal> : null}

      {modal === "service" ? <CostModal title="Activity-Based Service Cost" tone="green" onClose={() => setModal("")}><form className="cost-form" onSubmit={submitService}><Text label="Period date" type="date" value={serviceForm.periodDate} onChange={(v) => setServiceForm((f) => ({ ...f, periodDate: v }))} required /><Text label="Department" value={serviceForm.departmentName} onChange={(v) => setServiceForm((f) => ({ ...f, departmentName: v }))} /><Text label="Service code" value={serviceForm.serviceCode} onChange={(v) => setServiceForm((f) => ({ ...f, serviceCode: v }))} required /><Text label="Service name" value={serviceForm.serviceName} onChange={(v) => setServiceForm((f) => ({ ...f, serviceName: v }))} required /><Text label="Volume" type="number" value={serviceForm.volumeCount} onChange={(v) => setServiceForm((f) => ({ ...f, volumeCount: v }))} /><Text label="Revenue / billed amount" type="number" value={serviceForm.billedAmount} onChange={(v) => setServiceForm((f) => ({ ...f, billedAmount: v }))} /><Text label="Direct labour + material cost" type="number" value={serviceForm.directCost} onChange={(v) => setServiceForm((f) => ({ ...f, directCost: v }))} /><Text label="Allocated overhead" type="number" value={serviceForm.allocatedOverhead} onChange={(v) => setServiceForm((f) => ({ ...f, allocatedOverhead: v }))} /><Area label="ABC notes" value={serviceForm.notes} onChange={(v) => setServiceForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save ABC Cost" /></form></CostModal> : null}

      {modal === "department" ? <CostModal title="Department Cost Centre Report" tone="purple" onClose={() => setModal("")}><form className="cost-form" onSubmit={submitDepartment}><Text label="Period start" type="date" value={departmentForm.periodStart} onChange={(v) => setDepartmentForm((f) => ({ ...f, periodStart: v }))} required /><Text label="Period end" type="date" value={departmentForm.periodEnd} onChange={(v) => setDepartmentForm((f) => ({ ...f, periodEnd: v }))} required /><Text label="Department" value={departmentForm.departmentName} onChange={(v) => setDepartmentForm((f) => ({ ...f, departmentName: v }))} required /><Text label="Revenue" type="number" value={departmentForm.revenueAmount} onChange={(v) => setDepartmentForm((f) => ({ ...f, revenueAmount: v }))} /><Text label="Direct costs" type="number" value={departmentForm.directCost} onChange={(v) => setDepartmentForm((f) => ({ ...f, directCost: v }))} /><Text label="Allocated overhead" type="number" value={departmentForm.allocatedOverhead} onChange={(v) => setDepartmentForm((f) => ({ ...f, allocatedOverhead: v }))} /><Text label="Cases" type="number" value={departmentForm.casesCount} onChange={(v) => setDepartmentForm((f) => ({ ...f, casesCount: v }))} /><Area label="Management notes" value={departmentForm.notes} onChange={(v) => setDepartmentForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Report" /></form></CostModal> : null}

      {modal === "pricing" ? <CostModal title="Pricing Recommendation" tone="purple" onClose={() => setModal("")}><form className="cost-form" onSubmit={submitPricing}><Text label="Department" value={pricingForm.departmentName} onChange={(v) => setPricingForm((f) => ({ ...f, departmentName: v }))} /><Text label="Service code" value={pricingForm.serviceCode} onChange={(v) => setPricingForm((f) => ({ ...f, serviceCode: v }))} required /><Text label="Service name" value={pricingForm.serviceName} onChange={(v) => setPricingForm((f) => ({ ...f, serviceName: v }))} required /><Text label="Current price" type="number" value={pricingForm.currentPrice} onChange={(v) => setPricingForm((f) => ({ ...f, currentPrice: v }))} /><Text label="Recommended price" type="number" value={pricingForm.recommendedPrice} onChange={(v) => setPricingForm((f) => ({ ...f, recommendedPrice: v }))} /><Text label="Margin impact %" type="number" value={pricingForm.expectedMarginImpactPercent} onChange={(v) => setPricingForm((f) => ({ ...f, expectedMarginImpactPercent: v }))} /><Text label="Confidence score" type="number" value={pricingForm.confidenceScore} onChange={(v) => setPricingForm((f) => ({ ...f, confidenceScore: v }))} /><Area label="Reason" value={pricingForm.reason} onChange={(v) => setPricingForm((f) => ({ ...f, reason: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Recommendation" /></form></CostModal> : null}
    </main>
  );
}

function CostPanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="cost-panel"><div className="cost-panel-title"><h2>{title}</h2>{action}</div>{children}</section>;
}

function CostTable({ children }: { children: ReactNode }) {
  const tableId = useId();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const collapse = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id !== tableId) setExpanded(false);
    };
    window.addEventListener("hmis:cost-table-expanded", collapse);
    const collapseCurrent = () => setExpanded(false);
    window.addEventListener("hmis:cost-table-collapse", collapseCurrent);
    return () => {
      window.removeEventListener("hmis:cost-table-expanded", collapse);
      window.removeEventListener("hmis:cost-table-collapse", collapseCurrent);
    };
  }, [tableId]);

  const toggleExpanded = () => {
    const next = !expanded;
    if (next) window.dispatchEvent(new CustomEvent("hmis:cost-table-expanded", { detail: { id: tableId } }));
    setExpanded(next);
  };

  return (
    <div className={`cost-table-wrap ${expanded ? "is-cost-table-expanded" : ""}`.trim()}>
      <button
        type="button"
        className="cost-table-expand-btn"
        onClick={toggleExpanded}
        aria-label={expanded ? "Collapse table" : "Expand table"}
        title={expanded ? "Collapse table" : "Expand table"}
      >
        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
      <table className="cost-table">{children}</table>
    </div>
  );
}

function CostModal({ title, tone, onClose, children }: { title: string; tone: string; onClose: () => void; children: ReactNode }) {
  const icon = tone === "green" ? <Calculator size={19} /> : tone === "blue" ? <GitBranch size={19} /> : tone === "purple" ? <Layers size={19} /> : tone === "teal" ? <GitBranch size={19} /> : <DollarSign size={19} />;
  return <div className="cost-modal-backdrop"><section className={`cost-modal is-${tone}`}><header><div className="cost-modal-heading"><div className="cost-modal-icon">{icon}</div><div><span>Cost Accounting</span><h2>{title}</h2></div></div><button type="button" onClick={onClose} aria-label="Close form"><X size={18} /></button></header>{children}</section></div>;
}

function Text({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="wide"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option} key={option}>{option}</option>)}</select></label>;
}

function Footer({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return <footer><button type="button" onClick={onCancel}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : label}</button></footer>;
}
