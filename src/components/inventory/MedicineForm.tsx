import { useState } from "react";
import { Pill, Save, Calendar, Tag, DollarSign, Package } from "lucide-react";
import { api } from "../../lib/api";

interface MedicineFormProps {
  onSuccess?: () => void;
  initialData?: any;
}

export function MedicineForm({ onSuccess, initialData }: MedicineFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    genericName: initialData?.genericName || "",
    batchNumber: initialData?.batchNumber || "",
    expiryDate: initialData?.expiryDate
      ? new Date(initialData.expiryDate).toISOString().split("T")[0]
      : "",
    quantity: initialData?.quantity || 0,
    unitPrice: initialData?.unitPrice || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await api.patch(`/inventory/${initialData.id}`, {
          ...formData,
          expiryDate: new Date(formData.expiryDate),
          quantity: Number(formData.quantity),
          unitPrice: Number(formData.unitPrice),
        });
      } else {
        await api.post("/inventory", {
          ...formData,
          expiryDate: new Date(formData.expiryDate),
          quantity: Number(formData.quantity),
          unitPrice: Number(formData.unitPrice),
        });
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to save medicine", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="form-title-block">
        <div>
          <h3 className="form-title">
            <Pill className="w-5 h-5 text-primary" />
            Medication Stock Entry
          </h3>
          <p className="form-title-note">
            Capture batch details, quantities, and pricing for inventory control.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="form-label">
            Brand Name
          </label>
          <div className="relative">
            <Pill className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Panadol Extra"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="form-label">
            Generic Name
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Paracetamol"
              value={formData.genericName}
              onChange={(e) =>
                setFormData({ ...formData, genericName: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="form-label">
            Batch Number
          </label>
          <div className="relative">
            <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="BN-2024-001"
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="form-label">
            Expiry Date
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              type="date"
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="form-label">
            Quantity
          </label>
          <input
            required
            type="number"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="form-label">
            Unit Price ($)
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              type="number"
              step="0.01"
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
              value={formData.unitPrice}
              onChange={(e) =>
                setFormData({ ...formData, unitPrice: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
        <button
          disabled={loading}
          type="submit"
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Medication"}
        </button>
      </div>
    </form>
  );
}

