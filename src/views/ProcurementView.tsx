
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";

export default function ProcurementView() {
  return (
    <SimpleModulePlaceholder
      title="Procurement"
      subtitle="Purchase orders, vendors, and approvals"
      icon={<ModuleIcon name="shopping_cart" />}
      stats={[
        { label: "Pending PO", value: 9, color: "#dc2626" },
        { label: "Approved", value: 24, color: "#0d9488" },
        { label: "Suppliers", value: 36, color: "#1e3a8a" },
      ]}
      columns={[
        { label: "PO Number", key: "po" },
        { label: "Vendor", key: "vendor" },
        { label: "Amount", key: "amount" },
        { label: "Status", key: "status" },
      ]}
      rows={[
        {
          po: "PO-1092",
          vendor: "MedSupplies Ltd",
          amount: "KES 220,000",
          status: "Pending",
        },
        {
          po: "PO-1093",
          vendor: "HealthTech",
          amount: "KES 84,000",
          status: "Approved",
        },
      ]}
      searchPlaceholder="Search purchase orders"
      searchKeys={["po", "vendor", "status"]}
      actions={
        <button className="topbar-logout-btn">
          <ModuleIcon name="shopping_cart" /> New Purchase Order
        </button>
      }
    />
  );
}
