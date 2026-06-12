import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 36 }: AvatarProps) {
  const bg = name === "marcela" ? "var(--marce)" : "var(--jona)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%", background: bg,
      color: "#fff", fontWeight: 700, fontSize: size * 0.42, flexShrink: 0,
      fontFamily: "var(--font-display)",
    }}>{name === "marcela" ? "M" : "J"}</span>
  );
}
