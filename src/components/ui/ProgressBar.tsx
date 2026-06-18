interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, max, color = "var(--accent)", height = 8 }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{
        height: "100%", borderRadius: 99, width: `${pct}%`,
        background: pct >= 100
          ? "linear-gradient(90deg, var(--danger), #f87171)"
          : color.startsWith('var(')
            ? color
            : `linear-gradient(90deg, ${color}bb, ${color})`,
        transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}
