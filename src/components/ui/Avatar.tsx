interface AvatarProps {
  name: string;       // display name (para la inicial)
  persona?: string;   // clave interna: "marcela" | "jonatan" (para el color)
  size?: number;
}

export function Avatar({ name, persona, size = 36 }: AvatarProps) {
  const key = persona ?? name;
  const bg = key === "marcela" ? "var(--marce)" : "var(--jona)";
  const initial = name.charAt(0).toUpperCase();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%", background: bg,
      color: "#fff", fontWeight: 700, fontSize: size * 0.42, flexShrink: 0,
      fontFamily: "var(--font-display)",
    }}>{initial}</span>
  );
}
