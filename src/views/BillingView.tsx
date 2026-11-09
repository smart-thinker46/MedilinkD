
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import {
  MODULE_ACTION_FORMS,
  type ModuleActionField,
  type ModuleActionFormDefinition,
} from "../lib/moduleActionForms";
import { useAppStore } from "../store/appStore";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ReceiptPrinterAnimation } from "../components/ReceiptPrinter";
import { useLiveRefresh } from "../lib/liveRefresh";

type BillingStat = {
  label: string;
  value: string | number;
  color: string;
};

type TrendPieRow = {
  period: string;
  billed: number;
  paid: number;
  outstanding: number;
  color: string;
};

type FacilityInvoiceInfo = {
  name: string;
  location: string;
  phone: string;
  email: string;
  logoUrl: string;
};

const formatKes = (value: unknown) => {
  const amount = Number(value || 0);
  return `Ksh ${amount.toLocaleString("en-KE", {
    maximumFractionDigits: 0,
  })}`;
};

const asNumber = (value: unknown) => {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
};

const unwrapBillingPayload = (value: any) => value?.data?.data ?? value?.data ?? value ?? null;

const unwrapBillingRows = (value: any): any[] => {
  const payload = unwrapBillingPayload(value);
  if (Array.isArray(payload)) return payload;
  for (const candidate of [payload?.items, payload?.rows, payload?.results, payload?.data]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const patientName = (bill: any) =>
  `${bill?.patient?.firstName || ""} ${bill?.patient?.lastName || ""}`.trim() ||
  bill?.patientName ||
  bill?.patientId ||
  "Walk-in patient";

const resolveAssetUrl = (value?: string | null) => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return url.startsWith("/") ? url : `/${url}`;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const invoiceNumber = (invoice: any) => String(invoice?.invoiceNumber || invoice?.id || "-");

const invoiceLineTotal = (item: any) =>
  asNumber(item?.total ?? item?.lineTotal ?? asNumber(item?.quantity) * asNumber(item?.unitPrice));

const invoicePayments = (invoice: any) => {
  if (Array.isArray(invoice?.payments)) return invoice.payments;
  if (Array.isArray(invoice?.receipts)) return invoice.receipts;
  return [];
};

const buildInvoicePrintHtml = (invoice: any, facility: FacilityInvoiceInfo) => {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const payments = invoicePayments(invoice);
  const doctorName =
    `${invoice?.visit?.doctor?.firstName || ""} ${invoice?.visit?.doctor?.lastName || ""}`.trim() ||
    "-";
  const createdAt = invoice?.createdAt ? new Date(invoice.createdAt).toLocaleString() : "-";
  const logoMarkup = facility.logoUrl
    ? `<img src="${escapeHtml(facility.logoUrl)}" alt="${escapeHtml(facility.name)} logo" />`
    : `<div class="logo-fallback">${escapeHtml(facility.name.slice(0, 1) || "H")}</div>`;
  const itemRows = items.length
    ? items
        .map(
          (item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <strong>${escapeHtml(item?.description || item?.serviceName || "Service")}</strong>
                <span>${escapeHtml(item?.chargeType || item?.type || invoice?.sourceModule || "-")}</span>
              </td>
              <td>${escapeHtml(asNumber(item?.quantity) || 1)}</td>
              <td>${escapeHtml(formatKes(item?.unitPrice))}</td>
              <td>${escapeHtml(formatKes(invoiceLineTotal(item)))}</td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="5" class="empty">No line items recorded.</td></tr>`;
  const paymentRows = payments.length
    ? payments
        .map(
          (payment: any) => `
            <tr>
              <td>${escapeHtml(payment?.createdAt ? new Date(payment.createdAt).toLocaleString() : "-")}</td>
              <td>${escapeHtml(payment?.method || payment?.paymentMethod || "-")}</td>
              <td>${escapeHtml(payment?.transactionRef || payment?.reference || payment?.receiptNumber || "-")}</td>
              <td>${escapeHtml(formatKes(payment?.amount))}</td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="4" class="empty">No payments posted.</td></tr>`;

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${escapeHtml(invoiceNumber(invoice))}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; background: #f1f5f9; color: #0f172a; font-family: Arial, sans-serif; }
          .sheet { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 17mm; background: #fff; }
          .top { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 18px; border-bottom: 3px solid #1e3a8a; }
          .brand { display: flex; gap: 14px; align-items: flex-start; }
          .brand img, .logo-fallback { width: 74px; height: 74px; border: 1px solid #dbe4ef; border-radius: 14px; object-fit: contain; padding: 8px; }
          .logo-fallback { display: grid; place-items: center; color: #fff; background: #16a34a; font-size: 28px; font-weight: 900; }
          h1, h2, h3, p { margin: 0; }
          h1 { color: #0f172a; font-size: 24px; }
          .muted { margin-top: 5px; color: #64748b; font-size: 12px; line-height: 1.5; }
          .stamp { text-align: right; }
          .stamp span { color: #1e3a8a; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
          .stamp strong { display: block; margin-top: 5px; color: #0f172a; font-size: 22px; }
          .status { display: inline-block; margin-top: 8px; padding: 6px 10px; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 22px; }
          .box { border: 1px solid #dbe4ef; border-radius: 14px; padding: 14px; }
          .box h2 { color: #1e3a8a; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; }
          dl { display: grid; gap: 9px; margin: 12px 0 0; }
          .line { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 7px; }
          dt { color: #64748b; font-size: 12px; }
          dd { margin: 0; color: #0f172a; font-size: 12px; font-weight: 700; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-top: 22px; }
          th { background: #f8fafc; color: #475569; font-size: 11px; letter-spacing: .08em; text-align: left; text-transform: uppercase; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 11px 10px; font-size: 12px; vertical-align: top; }
          td strong { display: block; color: #0f172a; }
          td span { display: block; margin-top: 3px; color: #64748b; font-size: 11px; }
          .empty { color: #64748b; text-align: center; }
          .totals { width: 46%; margin: 20px 0 0 auto; border: 1px solid #dbe4ef; border-radius: 14px; overflow: hidden; }
          .totals .row { display: flex; justify-content: space-between; gap: 14px; padding: 10px 13px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          .totals .row:last-child { border-bottom: 0; }
          .totals .grand { background: #0f172a; color: #fff; font-size: 14px; font-weight: 900; }
          .payments-title { margin-top: 28px; color: #1e3a8a; font-size: 14px; }
          .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #dbe4ef; color: #64748b; font-size: 11px; line-height: 1.5; }
          @media print { body { background: #fff; } .sheet { margin: 0; box-shadow: none; } }
        </style>
      </head>
      <body>
        <main class="sheet">
          <section class="top">
            <div class="brand">
              ${logoMarkup}
              <div>
                <h1>${escapeHtml(facility.name)}</h1>
                <p class="muted">${escapeHtml(facility.location || "Kenya")}</p>
                <p class="muted">${escapeHtml([facility.phone, facility.email].filter(Boolean).join(" | "))}</p>
              </div>
            </div>
            <div class="stamp">
              <span>Patient Invoice</span>
              <strong>${escapeHtml(invoiceNumber(invoice))}</strong>
              <p class="status">${escapeHtml(invoice?.status || "OPEN")}</p>
            </div>
          </section>

          <section class="grid">
            <article class="box">
              <h2>Bill To</h2>
              <dl>
                <div class="line"><dt>Patient</dt><dd>${escapeHtml(patientName(invoice))}</dd></div>
                <div class="line"><dt>Patient ID</dt><dd>${escapeHtml(invoice?.patientId || "-")}</dd></div>
                <div class="line"><dt>Visit Type</dt><dd>${escapeHtml(invoice?.visit?.visitType || invoice?.sourceModule || "-")}</dd></div>
                <div class="line"><dt>Doctor</dt><dd>${escapeHtml(doctorName)}</dd></div>
              </dl>
            </article>
            <article class="box">
              <h2>Invoice Details</h2>
              <dl>
                <div class="line"><dt>Invoice No.</dt><dd>${escapeHtml(invoiceNumber(invoice))}</dd></div>
                <div class="line"><dt>Created</dt><dd>${escapeHtml(createdAt)}</dd></div>
                <div class="line"><dt>Visit ID</dt><dd>${escapeHtml(invoice?.visit?.id || invoice?.visitId || "-")}</dd></div>
                <div class="line"><dt>Payment Status</dt><dd>${escapeHtml(invoice?.status || "-")}</dd></div>
              </dl>
            </article>
          </section>

          <table>
            <thead>
              <tr><th>#</th><th>Service / Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <section class="totals">
            <div class="row"><span>Subtotal</span><strong>${escapeHtml(formatKes(invoice?.subtotal ?? invoice?.totalAmount))}</strong></div>
            <div class="row"><span>Tax</span><strong>${escapeHtml(formatKes(invoice?.taxAmount))}</strong></div>
            <div class="row"><span>Discount</span><strong>${escapeHtml(formatKes(invoice?.discountAmount))}</strong></div>
            <div class="row"><span>Insurance Cover</span><strong>${escapeHtml(formatKes(invoice?.insuranceCover))}</strong></div>
            <div class="row"><span>Total Paid</span><strong>${escapeHtml(formatKes(invoice?.totalPaid))}</strong></div>
            <div class="row grand"><span>Outstanding</span><strong>${escapeHtml(formatKes(invoice?.outstanding ?? invoice?.balance))}</strong></div>
          </section>

          <h3 class="payments-title">Payments & Receipts</h3>
          <table>
            <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead>
            <tbody>${paymentRows}</tbody>
          </table>

          <footer class="footer">
            This invoice was generated by Medilink HMIS. Please quote invoice number ${escapeHtml(invoiceNumber(invoice))} when making payment or requesting support.
          </footer>
        </main>
        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>`;
};

const cleanFormName = (value: string) => String(value || "").replace(/\s+Form$/i, "").trim();

const billingForms = (MODULE_ACTION_FORMS.billing?.forms || []).filter((form) =>
  [
    "Invoice Review & Finalise Form",
    "Payment Receipt Form",
    "Charge Master Entry Form",
    "Bill Adjustment Form",
  ].includes(form.name),
);

const actionPalette = ["#16a34a", "#2563eb", "#7c3aed", "#f59e0b"];

const getFormIconText = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("payment")) return "PAY";
  if (normalized.includes("charge")) return "CHG";
  if (normalized.includes("adjustment")) return "ADJ";
  return "INV";
};

const getFormMode = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("payment")) return "billing-mode-payment";
  if (normalized.includes("charge")) return "billing-mode-charge";
  if (normalized.includes("adjustment")) return "billing-mode-adjustment";
  return "billing-mode-invoice";
};

const getSubmitLabel = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("payment")) return "Post Payment Receipt";
  if (normalized.includes("charge")) return "Save Charge Master Entry";
  if (normalized.includes("adjustment")) return "Submit Bill Adjustment";
  return "Finalise Invoice";
};

export default function BillingView() {
  const { facility, facilityLogo } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [arReport, setArReport] = useState<any | null>(null);
  const [missedAudit, setMissedAudit] = useState<any | null>(null);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [chargeEvents, setChargeEvents] = useState<any[]>([]);
  const [financialExceptions, setFinancialExceptions] = useState<any[]>([]);
  const [chargeMaster, setChargeMaster] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("ALL");
  const [trendGrouping, setTrendGrouping] = useState("day");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [activeForm, setActiveForm] = useState<ModuleActionFormDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning">("success");
  const [refreshKey, setRefreshKey] = useState(0);
  const [runningAudit, setRunningAudit] = useState(false);
  const [lifecycleLoading, setLifecycleLoading] = useState("");

  const [paymentModal, setPaymentModal] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [resolvingException, setResolvingException] = useState("");
  const [printingReceipt, setPrintingReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (paymentModal) {
       setPaymentAmount(String(paymentModal.outstanding || paymentModal.balance || 0));
       setPaymentMethod("CASH");
       setPaymentRef("");
    }
  }, [paymentModal]);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal) return;
    const amount = Number(paymentAmount);
    const outstanding = asNumber(paymentModal.outstanding ?? paymentModal.balance);
    if (!Number.isFinite(amount) || amount <= 0 || (outstanding > 0 && amount > outstanding)) {
      showBillingToast("Enter a payment amount within the outstanding balance.", "warning");
      return;
    }
    setProcessingPayment(true);
    try {
      const response = await api.post(`/billing/bill/${paymentModal.id}/payment`, {
        amount,
        method: paymentMethod,
        reference: paymentRef,
      });
      showBillingToast("Payment processed successfully.", "success");
      setPaymentModal(null);
      setPrintingReceipt(response.data?.invoice || response.data?.bill || {
        ...paymentModal,
        amount,
        receiptNumber: paymentRef || paymentModal.invoiceNumber || paymentModal.id,
      });
      window.setTimeout(() => setPrintingReceipt(null), 1400);
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      showBillingToast(`Payment failed: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setProcessingPayment(false);
    }
  };

  const facilityDetails = useMemo<FacilityInvoiceInfo>(() => {
    let setup: any = {};
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("hmis_first_setup");
        setup = raw?.trim() ? JSON.parse(raw) : {};
      } catch {
        setup = {};
      }
    }
    const values = setup?.values || {};
    const savedFacility = setup?.savedFacility || {};
    const branding = setup?.branding || {};
    const activeFacility: any = facility || {};
    return {
      name:
        activeFacility.name ||
        values.shortName ||
        values.legalName ||
        values.facilityName ||
        savedFacility.shortName ||
        savedFacility.legalName ||
        savedFacility.name ||
        "Medilink Hospital",
      location:
        values.location ||
        values.address ||
        values.county ||
        savedFacility.location ||
        savedFacility.address ||
        savedFacility.county ||
        activeFacility.location ||
        activeFacility.address ||
        "Kenya",
      phone:
        values.phone ||
        values.phoneNumber ||
        savedFacility.phone ||
        savedFacility.phoneNumber ||
        activeFacility.phone ||
        "",
      email: values.email || savedFacility.email || activeFacility.email || "",
      logoUrl: resolveAssetUrl(
        branding.logoUrl ||
          savedFacility.logoUrl ||
          savedFacility.logo ||
          activeFacility.logoUrl ||
          facilityLogo ||
          "/MedilinkHMIS.png",
      ),
    };
  }, [facility, facilityLogo]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          ...(dateFrom ? { fromDate: dateFrom } : {}),
          ...(dateTo ? { toDate: dateTo } : {}),
          ...(status !== "ALL" ? { status } : {}),
        };
        const dashboardParams = {
          ...(dateFrom ? { fromDate: dateFrom } : {}),
          ...(dateTo ? { toDate: dateTo } : {}),
        };
        const [
          dashboardRes,
          reportRes,
          arRes,
          discountsRes,
          refundsRes,
          billsRes,
          chargeEventsRes,
          exceptionsRes,
          chargeMasterRes,
        ] = await Promise.allSettled([
          api.get("/billing/dashboard", { params: dashboardParams }),
          api.get("/billing/report", {
            params: { ...dashboardParams, groupBy: trendGrouping },
          }),
          api.get("/billing/ar"),
          api.get("/billing/discounts"),
          api.get("/billing/refunds"),
          api.get("/billing/bills", { params }),
          api.get("/billing/charge-events", { params: { limit: 100 } }),
          api.get("/billing/exceptions", { params: { limit: 100 } }),
          api.get("/billing/charge-master", { params: { limit: 100 } }),
        ]);

        if (!mounted) return;
        setDashboard(dashboardRes.status === "fulfilled" ? unwrapBillingPayload(dashboardRes.value) : null);
        setReport(reportRes.status === "fulfilled" ? unwrapBillingPayload(reportRes.value) : null);
        setArReport(arRes.status === "fulfilled" ? unwrapBillingPayload(arRes.value) : null);
        setDiscounts(discountsRes.status === "fulfilled" ? unwrapBillingRows(discountsRes.value) : []);
        setRefunds(refundsRes.status === "fulfilled" ? unwrapBillingRows(refundsRes.value) : []);
        setBills(billsRes.status === "fulfilled" ? unwrapBillingRows(billsRes.value) : []);
        setChargeEvents(chargeEventsRes.status === "fulfilled" ? unwrapBillingRows(chargeEventsRes.value) : []);
        setFinancialExceptions(exceptionsRes.status === "fulfilled" ? unwrapBillingRows(exceptionsRes.value) : []);
        setChargeMaster(chargeMasterRes.status === "fulfilled" ? unwrapBillingRows(chargeMasterRes.value) : []);

        const sourceResults: Array<[any, string]> = [
          [dashboardRes, "dashboard"], [reportRes, "revenue report"], [arRes, "accounts receivable"],
          [discountsRes, "discounts"], [refundsRes, "refunds"], [billsRes, "invoices"],
          [chargeEventsRes, "charge events"], [exceptionsRes, "financial exceptions"], [chargeMasterRes, "charge master"],
        ];
        const failedSources: string[] = sourceResults
          .filter((entry) => entry[0]?.status === "rejected")
          .map((entry) => entry[1]);
        if (failedSources.length) {
          setError(`${failedSources.join(", ")} could not be loaded. Check your connection or permissions.`);
        }
        const anyLoaded = [dashboardRes, reportRes, arRes, billsRes].some(
          (result) => result.status === "fulfilled",
        );
        if (!anyLoaded) {
          setError("Unable to load billing data.");
        }
      } catch (err: any) {
        if (mounted) setError(String(err?.message || "Unable to load billing data."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [dateFrom, dateTo, status, trendGrouping, refreshKey]);
  useLiveRefresh(() => setRefreshKey((value) => value + 1), { intervalMs: 60000 });

  const filteredBills = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return bills;
    return bills.filter((bill) =>
      [
        bill?.invoiceNumber,
        bill?.id,
        patientName(bill),
        bill?.patientId,
        bill?.status,
        bill?.visit?.visitType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [bills, search]);

  const filteredDiscounts = useMemo(() => {
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : 0;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
    return discounts.filter((row) => {
      const ts = new Date(String(row?.createdAt || row?.approvedAt || "")).getTime();
      if (!Number.isFinite(ts)) return true;
      return ts >= fromTs && ts <= toTs;
    });
  }, [dateFrom, dateTo, discounts]);

  const filteredRefunds = useMemo(() => {
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : 0;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
    return refunds.filter((row) => {
      const ts = new Date(String(row?.createdAt || row?.refundedAt || "")).getTime();
      if (!Number.isFinite(ts)) return true;
      return ts >= fromTs && ts <= toTs;
    });
  }, [dateFrom, dateTo, refunds]);

  const stats: BillingStat[] = useMemo(() => {
    const dashboardTotals = dashboard?.totals || {};
    const calculatedBilled = filteredBills.reduce(
      (sum, bill) => sum + asNumber(bill?.totalAmount),
      0,
    );
    const calculatedCollected = filteredBills.reduce(
      (sum, bill) => sum + asNumber(bill?.totalPaid),
      0,
    );
    const calculatedOutstanding = filteredBills.reduce(
      (sum, bill) => sum + Math.max(0, asNumber(bill?.outstanding)),
      0,
    );
    const calculatedDiscounts = filteredDiscounts.reduce(
      (sum, row) => sum + asNumber(row?.amount),
      0,
    );
    const calculatedRefunds = filteredRefunds.reduce(
      (sum, row) => sum + asNumber(row?.amount),
      0,
    );
    // Keep cards authoritative when the detailed invoice endpoint is briefly
    // unavailable: dashboard totals are calculated by the Billing service.
    const totalBilled = filteredBills.length ? calculatedBilled : asNumber(dashboardTotals.totalBilled);
    const totalCollected = filteredBills.length ? calculatedCollected : asNumber(dashboardTotals.totalPaid);
    const totalOutstanding = filteredBills.length ? calculatedOutstanding : asNumber(dashboardTotals.totalOutstanding);
    const totalDiscounts = filteredDiscounts.length ? calculatedDiscounts : asNumber(dashboardTotals.totalDiscounts);
    const totalRefunds = filteredRefunds.length ? calculatedRefunds : asNumber(dashboardTotals.totalRefunds);
    const collectionEfficiency =
      totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(2)) : 0;
    const refundRatio =
      totalCollected > 0 ? Number(((totalRefunds / totalCollected) * 100).toFixed(2)) : 0;
    const arOutstanding = asNumber(
      arReport?.totals?.totalOutstanding ?? dashboardTotals?.arAgingTotal,
    );
    const value = (fallback: string | number) => (loading ? "..." : fallback);

    return [
      { label: "Invoices", value: value(filteredBills.length || asNumber(dashboardTotals.invoices)), color: "#1e3a8a" },
      { label: "Total Billed", value: value(formatKes(totalBilled)), color: "#2563eb" },
      { label: "Total Collected", value: value(formatKes(totalCollected)), color: "#16a34a" },
      { label: "Total Outstanding", value: value(formatKes(totalOutstanding)), color: "#dc2626" },
      {
        label: "Collection Efficiency",
        value: value(`${collectionEfficiency.toFixed(2)}%`),
        color: "#0d9488",
      },
      { label: "Discounts", value: value(formatKes(totalDiscounts)), color: "#f59e0b" },
      { label: "Refunds", value: value(formatKes(totalRefunds)), color: "#be123c" },
      { label: "Refund Ratio", value: value(`${refundRatio.toFixed(2)}%`), color: "#7c3aed" },
      { label: "AR Outstanding", value: value(formatKes(arOutstanding)), color: "#475569" },
      { label: "Missed Charge Flags", value: value(missedAudit?.flaggedCount || 0), color: "#dc2626" },
      { label: "Discount Events", value: value(filteredDiscounts.length), color: "#0891b2" },
      { label: "Refund Events", value: value(filteredRefunds.length), color: "#991b1b" },
      { label: "Charge Events", value: value(chargeEvents.length), color: "#0f766e" },
      { label: "Financial Exceptions", value: value(financialExceptions.length), color: "#c2410c" },
      { label: "Active Tariffs", value: value(chargeMaster.length), color: "#4338ca" },
    ];
  }, [arReport, chargeEvents.length, chargeMaster.length, dashboard, filteredBills, filteredDiscounts, filteredRefunds, financialExceptions.length, loading, missedAudit]);

  const trendRows = Array.isArray(report?.rows) ? report.rows : [];
  const trendPie = useMemo(() => {
    const colors = ["#1e3a8a", "#16a34a", "#7c3aed", "#f59e0b", "#0891b2", "#be123c", "#475569", "#2563eb"];
    const rows = trendRows
      .slice(-8)
      .map((row: any, index: number) => ({
        period: String(row?.period || "-"),
        billed: asNumber(row?.billed),
        paid: asNumber(row?.paid),
        outstanding: asNumber(row?.outstanding),
        color: colors[index % colors.length],
      }))
      .filter((row: TrendPieRow) => row.billed > 0);
    const total = rows.reduce((sum: number, row: TrendPieRow) => sum + row.billed, 0);
    let cursor = 0;
    const gradient =
      total > 0
        ? rows
            .map((row: TrendPieRow) => {
              const start = cursor;
              const end = cursor + (row.billed / total) * 100;
              cursor = end;
              return `${row.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
            })
            .join(", ")
        : "#e2e8f0 0% 100%";
    return { rows, total, gradient };
  }, [trendRows]);

  function showBillingToast(message: string, type: "success" | "error" | "warning" = "success") {
    setToastType(type);
    setToast(message);
    window.setTimeout(() => setToast(""), type === "success" ? 2600 : 3600);
  }

  const findInvoiceForForm = (values: Record<string, string | boolean>) => {
    const key = String(values.invoice || values.invoice_number || "").trim().toLowerCase();
    if (!key) return selectedInvoice || null;
    return (
      bills.find((bill) =>
        [bill?.id, bill?.invoiceNumber]
          .map((value) => String(value || "").toLowerCase())
          .includes(key),
      ) || selectedInvoice || null
    );
  };

  const openBillingForm = (form: ModuleActionFormDefinition) => {
    const initialValues: Record<string, string | boolean> = {};
    if (selectedInvoice) {
      const name = patientName(selectedInvoice);
      initialValues.patient = name;
      initialValues.invoice = invoiceNumber(selectedInvoice);
      initialValues.invoice_number = invoiceNumber(selectedInvoice);
      initialValues.patient_liability = String(selectedInvoice.patientLiability || selectedInvoice.outstanding || 0);
      initialValues.insurance_coverage_amount = String(selectedInvoice.insuranceCover || 0);
      initialValues.amount_received = String(selectedInvoice.outstanding || selectedInvoice.balance || "");
    }
    setFormValues(initialValues);
    setActiveForm(form);
    setToast("");
  };

  const handleFormChange = (name: string, value: string | boolean) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const renderFormInput = (field: ModuleActionField) => {
    const value = formValues[field.name];
    const baseClass = "billing-form-input";

    if ((field.name === "invoice" || field.name === "invoice_number") && bills.length) {
      return (
        <select
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleFormChange(field.name, event.target.value)}
          required={field.required}
        >
          <option value="">Select an invoice</option>
          {bills.map((bill) => <option key={bill.id || bill.invoiceNumber} value={invoiceNumber(bill)}>{invoiceNumber(bill)} · {patientName(bill)} · {formatKes(bill.outstanding)}</option>)}
        </select>
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleFormChange(field.name, event.target.value)}
          placeholder={field.placeholder || field.helper}
          required={field.required}
        />
      );
    }

    if (field.type === "checkbox") {
      return (
        <label className="billing-checkbox-row">
          <input
            type="checkbox"
            required={field.required}
            checked={Boolean(value)}
            onChange={(event) => handleFormChange(field.name, event.target.checked)}
          />
          <span>Confirmed</span>
        </label>
      );
    }

    if (field.type === "select" && Array.isArray(field.options) && field.options.length > 0) {
      return (
        <select
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleFormChange(field.name, event.target.value)}
          required={field.required}
        >
          <option value="">Select an option</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        className={baseClass}
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => handleFormChange(field.name, event.target.value)}
        placeholder={field.placeholder || field.helper}
        required={field.required}
      />
    );
  };

  const submitBillingForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeForm) return;
    setSubmitting(true);
    try {
      const formName = activeForm.name.toLowerCase();
      const invoice = findInvoiceForForm(formValues);

      if (formName.includes("invoice review")) {
        if (!invoice?.id) throw new Error("Select or enter a valid invoice before finalising.");
        const discountAmount = asNumber(formValues.discount_amount);
        if (discountAmount > 0) {
          await api.post(`/billing/bill/${invoice.id}/discount`, {
            amount: discountAmount,
            type: String(formValues.discount_type || "MANUAL"),
            reason: "Invoice review discount",
            approvedBy: String(formValues.discount_authorised_by || ""),
          });
        }
        await api.post(`/billing/bill/${invoice.id}/lifecycle`, {
          status: "FINALISED",
          reason: String(formValues.billing_period || "Invoice reviewed and finalised"),
        });
      } else if (formName.includes("payment receipt")) {
        if (!invoice?.id) throw new Error("Select or enter a valid invoice before posting payment.");
        await api.post(`/billing/bill/${invoice.id}/payment`, {
          amount: asNumber(formValues.amount_received),
          method: String(formValues.payment_method || "CASH").toUpperCase().replace(/\s+/g, "_"),
          reference:
            String(formValues.mpesa_reference || "") ||
            String(formValues.bank_reference || "") ||
            String(formValues.card_last_4_digits || ""),
        });
      } else if (formName.includes("charge master")) {
        await api.post("/billing/charge-master", formValues);
      } else if (formName.includes("bill adjustment")) {
        if (!invoice?.id) throw new Error("Select or enter a valid invoice before adjusting.");
        const adjustmentType = String(formValues.adjustment_type || "").toLowerCase();
        const amount = asNumber(formValues.amount_adjusted);
        const reason = String(formValues.reason || "Billing adjustment");
        if (adjustmentType.includes("write")) {
          await api.post(`/billing/bill/${invoice.id}/lifecycle`, {
            status: "WRITTEN_OFF",
            reason,
          });
        } else if (adjustmentType.includes("discount")) {
          await api.post(`/billing/bill/${invoice.id}/discount`, {
            amount,
            type: "ADJUSTMENT",
            reason,
          });
        } else {
          await api.post(`/billing/bill/${invoice.id}/item`, {
            description: `${String(formValues.adjustment_type || "Correction")} - ${reason}`,
            quantity: 1,
            unitPrice: -Math.abs(amount),
            supervisorOverride: true,
          });
        }
      }

      // Financial mutation is already complete at this point. Audit logging
      // must not make a successful payment/charge appear to have failed.
      try {
        await api.post("/module-actions", {
          module: "billing",
          action: activeForm.name,
          payload: { data: formValues, description: activeForm.description },
        });
      } catch {
        // Keep the completed billing transaction visible; backend audit retry
        // or the normal billing event log remains authoritative.
      }
      if (formName.includes("payment receipt")) {
        setPrintingReceipt({
          ...(invoice || {}),
          amount: asNumber(formValues.amount_received),
          receiptNumber: String(formValues.mpesa_reference || formValues.bank_reference || formValues.card_last_4_digits || invoiceNumber(invoice)),
        });
        window.setTimeout(() => setPrintingReceipt(null), 1400);
      }
      showBillingToast(`${cleanFormName(activeForm.name)} completed successfully.`, "success");
      setActiveForm(null);
      setFormValues({});
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      showBillingToast(
        String(err?.response?.data?.message || err?.message || "Failed to save billing form."),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const runMissedChargeAudit = async () => {
    setRunningAudit(true);
    try {
      const response = await api.post("/billing/missed-charge-audit", {
        fromDate: dateFrom,
        toDate: dateTo,
      });
      setMissedAudit(response.data || null);
      showBillingToast(
        `${response.data?.flaggedCount || 0} potential missed charge(s) found.`,
        response.data?.flaggedCount > 0 ? "warning" : "success",
      );
    } catch (err: any) {
      showBillingToast(
        String(err?.response?.data?.message || err?.message || "Missed charge audit failed."),
        "error",
      );
    } finally {
      setRunningAudit(false);
    }
  };

  const resolveException = async (exception: any) => {
    const id = String(exception?.id || "");
    if (!id) return;
    const note = window.prompt("Resolution note:", "Reviewed by billing team") || "";
    if (!note.trim()) return;
    setResolvingException(id);
    try {
      await api.post(`/billing/exceptions/${id}/resolve`, { note });
      showBillingToast("Financial exception resolved.", "success");
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      showBillingToast(String(err?.response?.data?.message || err?.message || "Exception could not be resolved."), "error");
    } finally {
      setResolvingException("");
    }
  };

  const transitionInvoice = async (invoice: any, nextStatus: string) => {
    const billId = String(invoice?.id || "");
    if (!billId) return;
    const reason =
      nextStatus === "WRITTEN_OFF" || nextStatus === "DISPUTED"
        ? window.prompt(`Reason for ${nextStatus.replace("_", " ").toLowerCase()}:`) || ""
        : "";
    if ((nextStatus === "WRITTEN_OFF" || nextStatus === "DISPUTED") && !reason.trim()) return;

    setLifecycleLoading(`${billId}:${nextStatus}`);
    try {
      const response = await api.post(`/billing/bill/${billId}/lifecycle`, {
        status: nextStatus,
        reason,
      });
      const updated = response.data?.invoice;
      if (updated) {
        setBills((rows) => rows.map((row) => (row.id === billId ? updated : row)));
        setSelectedInvoice((current: any | null) => (current?.id === billId ? updated : current));
      }
      showBillingToast(response.data?.message || `Invoice moved to ${nextStatus}.`, "success");
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      showBillingToast(
        String(err?.response?.data?.message || err?.message || "Invoice status update failed."),
        "error",
      );
    } finally {
      setLifecycleLoading("");
    }
  };

  const openInvoicePrintWindow = (invoice: any) => {
    const html = buildInvoicePrintHtml(invoice, facilityDetails);
    const printWindow = window.open("", "_blank", "width=940,height=1200");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const downloadInvoicePdf = (invoice: any) => {
    if (printingReceipt) return;
    setPrintingReceipt(invoice);
    window.setTimeout(() => {
      openInvoicePrintWindow(invoice);
      setPrintingReceipt(null);
    }, 1400);
  };

  return (
    <div className="patients-view billing-dashboard-view">
      <ReceiptPrinterAnimation receipt={printingReceipt} hospitalName={facilityDetails.name} />
      <div className="pv-header">
        <div>
          <div className="pv-title flex items-center gap-2">
            <span className="billing-title-icon" aria-hidden="true">KES</span>
            Billing & Payments
          </div>
          <div className="pv-subtitle">Charges, receipts, and patient balances</div>
        </div>
        <div className="billing-action-bar">
          <button
            type="button"
            className="billing-secondary-btn"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            Refresh
          </button>
          <button
            type="button"
            className="billing-audit-btn"
            onClick={runMissedChargeAudit}
            disabled={runningAudit}
          >
            {runningAudit ? "Auditing..." : "Missed Charge Audit"}
          </button>
          {billingForms.map((form, index) => {
            const color = actionPalette[index % actionPalette.length];
            return (
              <button
                key={form.name}
                type="button"
                className="billing-action-btn"
                style={{
                  backgroundColor: color,
                  borderColor: color,
                  boxShadow: `0 10px 20px ${color}30`,
                }}
                onClick={() => openBillingForm(form)}
              >
                <span aria-hidden="true">{getFormIconText(form.name)}</span>
                {cleanFormName(form.name)}
              </button>
            );
          })}
        </div>
      </div>

      <section className="module-filter-panel billing-filter-panel">
        <div className="module-filter-grid billing-filter-grid">
          <label className="module-filter-field">
            <span>Date From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label className="module-filter-field">
            <span>Date To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
          <label className="module-filter-field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="FINALISED">Finalised</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="DISPUTED">Disputed</option>
              <option value="WRITTEN_OFF">Written Off</option>
            </select>
          </label>
          <label className="module-filter-field">
            <span>Trend Grouping</span>
            <select
              value={trendGrouping}
              onChange={(event) => setTrendGrouping(event.target.value)}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </label>
          <label className="module-filter-field is-wide">
            <span>Search Invoices</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Invoice number, patient, status, visit type..."
            />
          </label>
        </div>
      </section>

      {error ? <div className="workflow-notice is-error">{error}</div> : null}

      <div className="pv-stats billing-stats-grid">
        {stats.slice(0, 6).map((stat) => (
          <article
            key={stat.label}
            className="pv-stat-card"
            style={{ borderLeftColor: stat.color }}
          >
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </article>
        ))}
      </div>
      <div className="billing-supporting-metrics" aria-label="Additional billing metrics">
        {stats.slice(6).map((stat) => <div key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}
      </div>

      <section className="billing-trend-panel">
        <div>
          <h3>Revenue Trend</h3>
          <p>
            {trendRows.length} periods grouped by {String(report?.groupBy || trendGrouping).toLowerCase()}.
          </p>
        </div>
        <div className="billing-trend-pie-layout">
          <div
            className="billing-trend-pie"
            style={{ background: `conic-gradient(${trendPie.gradient})` }}
            aria-label="Revenue trend pie chart"
          >
            <div>
              <span>Total Billed</span>
              <strong>{formatKes(trendPie.total)}</strong>
            </div>
          </div>
          <div className="billing-trend-legend">
            {trendPie.rows.map((row: TrendPieRow) => (
              <div key={row.period} className="billing-trend-legend-row">
                <i style={{ backgroundColor: row.color }} />
                <span>{row.period}</span>
                <strong>{formatKes(row.billed)}</strong>
              </div>
            ))}
          </div>
          {!loading && trendRows.length === 0 ? (
            <div className="pv-empty">No trend data for selected filters.</div>
          ) : null}
        </div>
      </section>

      {missedAudit ? (
        <section className="billing-audit-panel">
          <div className="billing-audit-panel-head">
            <div>
              <h3>Missed Charge Detection</h3>
              <p>
                Reviewed {missedAudit.reviewedClinicalEvents || 0} clinical event(s) against{" "}
                {missedAudit.existingChargeItems || 0} invoice item(s).
              </p>
            </div>
            <span className={missedAudit.flaggedCount > 0 ? "is-warning" : "is-clear"}>
              {missedAudit.flaggedCount || 0} flag(s)
            </span>
          </div>
          <div className="pv-table-wrap billing-audit-table">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Clinical Event</th>
                  <th>Patient</th>
                  <th>Visit</th>
                  <th>Occurred</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(missedAudit.flags) && missedAudit.flags.length > 0 ? (
                  missedAudit.flags.slice(0, 8).map((flag: any) => (
                    <tr key={`${flag.sourceModule}-${flag.sourceRecordId}`}>
                      <td>{String(flag.sourceModule || "-")}</td>
                      <td className="pv-name">{String(flag.description || flag.eventType || "-")}</td>
                      <td>{String(flag.patientId || "-")}</td>
                      <td>{String(flag.visitId || "-")}</td>
                      <td>{flag.occurredAt ? new Date(flag.occurredAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="pv-empty">No missed charges detected in this audit.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="billing-operations-grid">
        <article className="billing-operations-panel">
          <header><div><h3>Automatic Charge Capture</h3><p>Idempotent clinical events received by Billing.</p></div><strong>{chargeEvents.length}</strong></header>
          <div className="pv-table-wrap"><table className="pv-table"><thead><tr><th>Event</th><th>Source</th><th>Service</th><th>Status</th></tr></thead><tbody>
            {chargeEvents.slice(0, 8).map((row: any, index: number) => <tr key={row.id || row.eventNumber || index}><td className="pv-name">{row.eventNumber || row.sourceRecordId || "-"}</td><td>{row.sourceModule || "-"}</td><td>{row.serviceCode || "-"}</td><td><span className={`billing-status billing-status-${String(row.status || "unknown").toLowerCase()}`}>{row.status || "-"}</span></td></tr>)}
            {!chargeEvents.length ? <tr><td colSpan={4} className="pv-empty">No charge events have been captured.</td></tr> : null}
          </tbody></table></div>
        </article>
        <article className="billing-operations-panel">
          <header><div><h3>Financial Exceptions</h3><p>Duplicate, failed, or unmatched billing events requiring review.</p></div><strong>{financialExceptions.length}</strong></header>
          <div className="pv-table-wrap"><table className="pv-table"><thead><tr><th>Type</th><th>Message</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {financialExceptions.slice(0, 8).map((row: any, index: number) => <tr key={row.id || index}><td>{row.type || row.code || "Exception"}</td><td className="pv-name">{row.message || row.description || "-"}</td><td>{row.status || "OPEN"}</td><td><button type="button" className="billing-mini-btn is-green" disabled={String(row.status).toUpperCase() === "RESOLVED" || resolvingException === row.id} onClick={() => void resolveException(row)}>{String(row.status).toUpperCase() === "RESOLVED" ? "Resolved" : resolvingException === row.id ? "Saving..." : "Resolve"}</button></td></tr>)}
            {!financialExceptions.length ? <tr><td colSpan={4} className="pv-empty">No financial exceptions require review.</td></tr> : null}
          </tbody></table></div>
        </article>
      </section>

      <div className="pv-table-meta">
        <h3>Invoice View</h3>
        <span className="pv-table-count">{filteredBills.length} invoices</span>
      </div>

      <div className="pv-table-wrap billing-invoice-table">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Patient</th>
              <th>Visit</th>
              <th>Status</th>
              <th>Total</th>
              <th>Insurance</th>
              <th>Patient Pays</th>
              <th>Paid</th>
              <th>Outstanding</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="pv-empty">
                  Loading billing invoices...
                </td>
              </tr>
            ) : filteredBills.length === 0 ? (
              <tr>
                <td colSpan={11} className="pv-empty">
                  No invoices match the selected filters.
                </td>
              </tr>
            ) : (
              filteredBills.map((bill) => (
                <tr
                  key={String(bill?.id || bill?.invoiceNumber)}
                  className="billing-clickable-row"
                  tabIndex={0}
                  title="Click to view invoice details"
                  onClick={() => setSelectedInvoice(bill)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedInvoice(bill);
                    }
                  }}
                >
                  <td className="pv-name">{String(bill?.invoiceNumber || bill?.id || "-")}</td>
                  <td>{patientName(bill)}</td>
                  <td>{String(bill?.visit?.visitType || bill?.sourceModule || "-")}</td>
                  <td>
                    <span className={`billing-status billing-status-${String(bill?.status || "unknown").toLowerCase()}`}>
                      {String(bill?.status || "-")}
                    </span>
                  </td>
                  <td>{formatKes(bill?.totalAmount)}</td>
                  <td>{formatKes(bill?.insuranceCover)}</td>
                  <td>{formatKes(bill?.patientLiability ?? bill?.insuranceSplit?.patient)}</td>
                  <td>{formatKes(bill?.totalPaid)}</td>
                  <td>{formatKes(bill?.outstanding)}</td>
                  <td>{bill?.createdAt ? new Date(bill.createdAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <div className="billing-row-actions" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="billing-view-btn"
                        onClick={() => setSelectedInvoice(bill)}
                      >
                        <span aria-hidden="true">INV</span>
                        View
                      </button>
                      {String(bill?.status) === "OPEN" ? (
                        <button
                          type="button"
                          className="billing-mini-btn is-blue"
                          disabled={lifecycleLoading === `${bill.id}:FINALISED`}
                          onClick={() => transitionInvoice(bill, "FINALISED")}
                        >
                          Finalise
                        </button>
                      ) : null}
                      {String(bill?.status) === "FINALISED" ? (
                        <button
                          type="button"
                          className="billing-mini-btn is-indigo"
                          disabled={lifecycleLoading === `${bill.id}:AWAITING_PAYMENT`}
                          onClick={() => transitionInvoice(bill, "AWAITING_PAYMENT")}
                        >
                          Present
                        </button>
                      ) : null}
                      {!["PAID", "WRITTEN_OFF"].includes(String(bill?.status)) && (
                         <button
                           type="button"
                           className="billing-mini-btn is-green"
                           onClick={() => setPaymentModal(bill)}
                         >
                           Pay
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleProcessPayment} className="billing-payment-modal bg-card p-6 rounded-2xl border border-border shadow-xl w-full max-w-md">
            <button
              type="button"
              className="billing-modal-x"
              onClick={() => setPaymentModal(null)}
              aria-label="Close payment form"
            >
              x
            </button>
            <h2 className="text-xl font-bold mb-2">Process Payment</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Recording payment for Invoice {invoiceNumber(paymentModal)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="form-label">Outstanding Balance</label>
                <div className="text-xl font-bold text-red-600 mt-1">
                   {formatKes(paymentModal.outstanding || paymentModal.balance || 0)}
                </div>
              </div>

              <div>
                <label className="form-label">Payment Amount</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentModal.outstanding || paymentModal.balance || undefined}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="MOBILE">Mobile Money (M-PESA)</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="INSURANCE">Insurance Cover</option>
                </select>
              </div>

              <div>
                <label className="form-label">Reference / Transaction ID</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                  placeholder="Optional..."
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setPaymentModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {processingPayment ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {selectedInvoice ? (
        <div className="billing-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <section className="billing-invoice-modal" onClick={(event) => event.stopPropagation()}>
            <div className="billing-invoice-toolbar">
              <button
                type="button"
                className="billing-invoice-download"
                onClick={() => downloadInvoicePdf(selectedInvoice)}
              >
                Download PDF
              </button>
              <button
                type="button"
                className="billing-invoice-close"
                onClick={() => setSelectedInvoice(null)}
              >
                x
              </button>
            </div>

            <article className="billing-pdf-sheet" id="billing-print-invoice">
              <header className="billing-pdf-header">
                <div className="billing-hospital-brand">
                  {facilityDetails.logoUrl ? (
                    <img
                      src={facilityDetails.logoUrl}
                      alt={`${facilityDetails.name} logo`}
                      className="billing-hospital-logo"
                    />
                  ) : (
                    <div className="billing-logo-fallback">{facilityDetails.name.slice(0, 1) || "H"}</div>
                  )}
                  <div>
                    <h2>{facilityDetails.name}</h2>
                    <p>{facilityDetails.location}</p>
                    <p>{[facilityDetails.phone, facilityDetails.email].filter(Boolean).join(" | ")}</p>
                  </div>
                </div>
                <div className="billing-invoice-stamp">
                  <span>Patient Invoice</span>
                  <strong>{invoiceNumber(selectedInvoice)}</strong>
                  <p>{String(selectedInvoice?.status || "OPEN")}</p>
                </div>
              </header>

              <section className="billing-pdf-meta-grid">
                <article>
                  <h3>Bill To</h3>
                  <dl>
                    <div><dt>Patient</dt><dd>{patientName(selectedInvoice)}</dd></div>
                    <div><dt>Patient ID</dt><dd>{String(selectedInvoice?.patientId || "-")}</dd></div>
                    <div><dt>Visit Type</dt><dd>{String(selectedInvoice?.visit?.visitType || selectedInvoice?.sourceModule || "-")}</dd></div>
                    <div><dt>Doctor</dt><dd>{`${selectedInvoice?.visit?.doctor?.firstName || ""} ${selectedInvoice?.visit?.doctor?.lastName || ""}`.trim() || "-"}</dd></div>
                  </dl>
                </article>
                <article>
                  <h3>Invoice Details</h3>
                  <dl>
                    <div><dt>Invoice No.</dt><dd>{invoiceNumber(selectedInvoice)}</dd></div>
                    <div><dt>Created</dt><dd>{selectedInvoice?.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : "-"}</dd></div>
                    <div><dt>Visit ID</dt><dd>{String(selectedInvoice?.visit?.id || selectedInvoice?.visitId || "-")}</dd></div>
                    <div><dt>Payment Status</dt><dd>{String(selectedInvoice?.status || "-")}</dd></div>
                  </dl>
                </article>
              </section>

              <section className="billing-pdf-services">
                <h3>Services & Charges</h3>
                <table className="billing-pdf-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Service / Item</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(selectedInvoice?.items) && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item: any, index: number) => (
                        <tr key={String(item?.id || index)}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{String(item?.description || item?.serviceName || "Service")}</strong>
                            <span>{String(item?.chargeType || item?.type || selectedInvoice?.sourceModule || "-")}</span>
                          </td>
                          <td>{asNumber(item?.quantity) || 1}</td>
                          <td>{formatKes(item?.unitPrice)}</td>
                          <td>{formatKes(invoiceLineTotal(item))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="pv-empty">No line items recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <section className="billing-pdf-total-panel">
                <div><span>Subtotal</span><strong>{formatKes(selectedInvoice?.subtotal ?? selectedInvoice?.totalAmount)}</strong></div>
                <div><span>Tax</span><strong>{formatKes(selectedInvoice?.taxAmount)}</strong></div>
                <div><span>Discount</span><strong>{formatKes(selectedInvoice?.discountAmount)}</strong></div>
                <div><span>Insurance Cover</span><strong>{formatKes(selectedInvoice?.insuranceCover)}</strong></div>
                <div><span>Total Paid</span><strong>{formatKes(selectedInvoice?.totalPaid)}</strong></div>
                <div className="is-grand"><span>Outstanding</span><strong>{formatKes(selectedInvoice?.outstanding ?? selectedInvoice?.balance)}</strong></div>
              </section>

              <section className="billing-pdf-payments">
                <h3>Payments & Receipts</h3>
                <table className="billing-pdf-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicePayments(selectedInvoice).length > 0 ? (
                      invoicePayments(selectedInvoice).map((payment: any, index: number) => (
                        <tr key={String(payment?.id || index)}>
                          <td>{payment?.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}</td>
                          <td>{String(payment?.method || payment?.paymentMethod || "-")}</td>
                          <td>{String(payment?.transactionRef || payment?.reference || payment?.receiptNumber || "-")}</td>
                          <td>{formatKes(payment?.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="pv-empty">No payments posted.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <footer className="billing-pdf-footer">
                This invoice was generated by Medilink HMIS. Please quote invoice number{" "}
                <strong>{invoiceNumber(selectedInvoice)}</strong> when making payment or requesting support.
              </footer>
            </article>
          </section>
        </div>
      ) : null}

      {activeForm ? (
        <div className="billing-form-overlay" onClick={() => setActiveForm(null)}>
          <section
            className={`billing-form-panel ${getFormMode(activeForm.name)}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="billing-form-header">
              <div className="billing-form-heading">
                <span className="billing-form-icon" aria-hidden="true">
                  {getFormIconText(activeForm.name)}
                </span>
                <div>
                  <span className="billing-form-kicker">Billing & Payments</span>
                  <h2>{cleanFormName(activeForm.name)}</h2>
                  <p>{activeForm.description}</p>
                </div>
              </div>
              <button
                type="button"
                className="billing-modal-x"
                onClick={() => setActiveForm(null)}
                aria-label="Close billing form"
              >
                x
              </button>
            </header>
            <form className="billing-form-body" onSubmit={submitBillingForm}>
              <div className="billing-form-grid">
                {activeForm.fields.map((field) => (
                  <label
                    key={field.name}
                    className={`billing-form-field ${
                      field.type === "textarea" || /line_items|reason/i.test(field.name) ? "is-wide" : ""
                    }`}
                  >
                    <span className="billing-form-label">
                      {field.label}
                      {field.required ? <i>*</i> : null}
                    </span>
                    {field.helper ? <small>{field.helper}</small> : null}
                    {renderFormInput(field)}
                  </label>
                ))}
              </div>
              <footer className="billing-form-footer">
                <button type="button" className="billing-form-cancel" onClick={() => setActiveForm(null)}>
                  Cancel
                </button>
                <button type="submit" className="billing-form-submit" disabled={submitting}>
                  {submitting ? "Saving..." : getSubmitLabel(activeForm.name)}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {toast ? <div className={`module-toast billing-toast is-${toastType}`} role={toastType === "error" ? "alert" : "status"} aria-live={toastType === "error" ? "assertive" : "polite"}><span className="billing-toast-icon" aria-hidden="true">{toastType === "success" ? <CheckCircle2 size={17} /> : toastType === "warning" ? <AlertTriangle size={17} /> : <Info size={17} />}</span><div><strong>Billing & Payments</strong><span>{toast}</span></div><button type="button" className="billing-toast-close" aria-label="Dismiss Billing notification" onClick={() => setToast("")}><X size={16} /></button></div> : null}
    </div>
  );
}
