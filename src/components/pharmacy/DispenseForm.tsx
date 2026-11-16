import { useState, useEffect } from "react";
import {
  Pill,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  User,
  Package,
} from "lucide-react";
import { api } from "../../lib/api";

interface DispenseFormProps {
  prescriptionId: string;
  medication: string;
  onSuccess?: () => void;
}

export function DispenseForm({
  prescriptionId,
  medication,
  onSuccess,
}: DispenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory");
      // Filter inventory that matches or is similar to the prescription
      setInventory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/pharmacy/dispense", {
        prescriptionId,
        medicineId: selectedMedicine,
        quantity: Number(quantity),
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Dispensing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="form-title-block">
        <div>
          <h3 className="form-title">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Dispense Medication
          </h3>
          <p className="form-title-note">
            Select an inventory batch and confirm dispensing quantity.
          </p>
        </div>
      </div>
      <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20">
        <div className="flex items-center gap-4 mb-2 text-primary">
          <div className="w-10 h-10 rounded-2xl bg-white border border-primary/10 flex items-center justify-center shadow-sm">
            <Pill className="w-6 h-6" />
          </div>
          <p className="text-xl font-black">{medication}</p>
        </div>
        <p className="text-xs font-bold text-muted-foreground italic ml-14">
          Prescribed Medication
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="form-label">
            Select from Inventory
          </label>
          <div className="relative">
            <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              required
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 appearance-none font-bold"
              value={selectedMedicine}
              onChange={(e) => setSelectedMedicine(e.target.value)}
            >
              <option value="">Choose item...</option>
              {inventory.map((m) => (
                <option key={m.id} value={m.id} disabled={m.quantity === 0}>
                  {m.name} - {m.batchNumber} ({m.quantity} in stock)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="form-label">
            Dispensing Quantity
          </label>
          <input
            required
            type="number"
            min="1"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 font-black"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          disabled={loading}
          type="submit"
          className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <ShoppingCart className="w-4 h-4" />
          {loading ? "Completing..." : "Complete Dispense"}
        </button>
      </div>
    </form>
  );
}

