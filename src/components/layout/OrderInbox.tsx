import React, { useEffect, useState, useCallback } from "react";
import { ShoppingCart, X } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

type OrderInboxProps = {
  destinationModule: string;
  onClose: () => void;
};

export function OrderInbox({ destinationModule, onClose }: OrderInboxProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<any>(
        `/orchestration/orders?destinationModule=${encodeURIComponent(
          destinationModule,
        )}&status=ORDERED,SUBMITTED,ROUTED,RECEIVED,ACKNOWLEDGED,READY,SCHEDULED,IN_PROGRESS`,
      );
      const data = response?.data ?? response;
      setOrders(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [destinationModule]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (id: string, status: string) => {
    setSaving(id);
    try {
      await apiFetch(`/orchestration/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reason: `Processed by ${destinationModule}`,
        }),
      });
      await load();
      window.dispatchEvent(new CustomEvent("hmis:clinical-order-updated"));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div
      className="order-inbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${destinationModule} orders`}
    >
      <section className="order-inbox-panel">
        <header className="order-inbox-header">
          <div>
            <span>
              <ShoppingCart size={15} /> RECEIVING WORKLIST
            </span>
            <h2>{destinationModule} Orders</h2>
            <p>Review and process orders routed from the shared clinical workflow.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close orders">
            <X size={18} />
          </button>
        </header>
        <div className="order-inbox-body">
          {loading ? (
            <p className="order-inbox-empty">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="order-inbox-empty">No new orders have been received.</p>
          ) : (
            orders.map((order) => (
              <article className="order-inbox-row" key={order.id}>
                <div>
                  <strong>{order.orderNumber || order.orderType}</strong>
                  <span>
                    {order.orderType} · {order.priority || "ROUTINE"}
                  </span>
                  <small>{order.clinicalIndication || "No indication provided"}</small>
                </div>
                <div className="order-inbox-actions">
                  <button
                    type="button"
                    disabled={saving === order.id}
                    onClick={() => void update(order.id, "ACCEPTED")}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={saving === order.id}
                    onClick={() => void update(order.id, "IN_PROGRESS")}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    disabled={saving === order.id}
                    onClick={() => void update(order.id, "COMPLETED")}
                  >
                    Complete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

