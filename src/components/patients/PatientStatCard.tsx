export function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
  active,
}: {
  icon?: any;
  label: string;
  value: any;
  color?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div
      className={`pv-stat-card ${onClick ? "is-clickable" : ""} ${active ? "is-active" : ""}`}
      style={{ borderLeftColor: color }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <p className="pv-stat-label">{label}</p>
      <p className="pv-stat-value">{value}</p>
    </div>
  );
}
