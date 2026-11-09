"use client";

import { Printer } from "lucide-react";

type ReceiptPrinterProps = {
  receipt: any;
  hospitalName?: string;
  message?: string;
};

/** A small, reusable printer animation used by all billing workflows. */
export function ReceiptPrinterAnimation({ receipt, hospitalName = "Medilink HMIS", message = "Printing receipt..." }: ReceiptPrinterProps) {
  if (!receipt) return null;
  const amount = Number(receipt?.amount ?? receipt?.totalAmount ?? receipt?.total ?? receipt?.outstanding ?? 0);
  const reference = receipt?.receiptNumber || receipt?.invoiceNumber || receipt?.id || "Receipt";

  return (
    <div className="pos-print-animation" role="status" aria-live="polite" aria-label="Receipt is being printed">
      <div className="pos-print-scene">
        <div className="pos-printer" aria-hidden="true">
          <div className="pos-printer-top"><Printer size={30} /></div>
          <div className="pos-printer-slot" />
          <div className="pos-printer-body" />
          <div className="pos-paper">
            <strong>{hospitalName}</strong>
            <span>{reference}</span>
            <b>KES {amount.toLocaleString("en-KE", { maximumFractionDigits: 2 })}</b>
          </div>
        </div>
        <strong className="pos-print-status">{message}</strong>
        <span className="pos-print-caption">Your receipt is being prepared for printing</span>
      </div>
    </div>
  );
}

export default ReceiptPrinterAnimation;
