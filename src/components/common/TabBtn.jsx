export function TabBtn({ icon, label, active, onClick }) {
  return (
    <button className={`tab${active ? " active" : ""}`} onClick={onClick}>
      {icon}{label}
    </button>
  );
}
