type RecordDrawerProps = {
  record: any;
  title?: string;
  onClose: () => void;
};

const labelize = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

type PrimitiveEntry = [string, string];

const primitiveEntries = (value: any, prefix = ""): PrimitiveEntry[] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, item]): PrimitiveEntry[] => {
    if (
      ["original", "actions"].includes(key) ||
      item === null ||
      item === undefined ||
      typeof item === "function" ||
      (item && typeof item === "object" && "$$typeof" in item)
    )
      return [];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof item === "object") return primitiveEntries(item, path);
    const text = String(item).trim();
    return text ? [[path, text]] : [];
  });
};

export function RecordDrawer({
  record,
  title = "Record details",
  onClose,
}: RecordDrawerProps) {
  if (!record) return null;
  const entries = primitiveEntries(record)
    .filter(([key]) => !["id", "patientId"].includes(key))
    .slice(0, 60);

  return (
    <div className="module-patient-drawer-backdrop" onClick={onClose}>
      <aside
        className="module-patient-drawer record-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="module-patient-drawer-header">
          <div className="module-patient-drawer-identity">
            <div className="module-patient-drawer-avatar">
              {String(title).trim().slice(0, 1).toUpperCase()}
            </div>
            <div>
              <span>{title}</span>
              <h3>Record overview</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close record details">
            ×
          </button>
        </div>
        <div className="module-patient-drawer-body">
          <div className="module-patient-drawer-grid">
            {entries.map(([key, value]) => (
              <div key={key}>
                <small>{labelize(key.split(".").pop() || key)}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          {entries.length === 0 ? (
            <div className="patient-drawer-empty">No displayable details available.</div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

