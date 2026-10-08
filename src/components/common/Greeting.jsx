import { Sun, Sunset, Moon } from "lucide-react";
import { clockHM } from "../../utils/date";

export function Greeting({ name, now }) {
  const hour = parseInt(clockHM(new Date(now).toISOString()).slice(0, 2), 10);
  let text = "Good evening", Icon = Moon, bg = "var(--brand-tint)", fg = "var(--brand)";
  if (hour >= 5 && hour < 12) { text = "Good morning"; Icon = Sun; bg = "var(--amber-tint)"; fg = "var(--amber)"; }
  else if (hour >= 12 && hour < 17) { text = "Good afternoon"; Icon = Sun; bg = "var(--amber-tint)"; fg = "var(--amber)"; }
  else if (hour >= 17 && hour < 21) { text = "Good evening"; Icon = Sunset; bg = "var(--amber-tint)"; fg = "var(--amber)"; }
  const dateText = new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Colombo" });
  return (
    <div className="stamp-card" style={{ padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "center", gap: 18, textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={26} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", transform: "translateX(-25px)" }}>{text},</div>
        <div className="disp" style={{ fontSize: "clamp(22px, 4.5vw, 30px)", fontWeight: 700, lineHeight: 1.15 }}>{name} 👋</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3, transform: "translateX(-25px)" }}>{dateText}</div>
      </div>
    </div>
  );
}
