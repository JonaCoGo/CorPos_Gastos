interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div style={{
      width, height, borderRadius,
      background: "var(--surface2)",
      backgroundImage: "linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }} />
  );
}

export function AppSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
      {/* Card 1 */}
      <div style={{ background: "var(--surface)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid var(--border)" }}>
        <Skeleton height={12} width="40%" borderRadius={6} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Skeleton width={26} height={26} borderRadius={13} />
              <Skeleton width={80} height={12} borderRadius={6} />
            </div>
            <Skeleton height={10} width="100%" borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton height={10} width="80%" borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton height={22} width="50%" borderRadius={6} />
          </div>
          <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Skeleton width={26} height={26} borderRadius={13} />
              <Skeleton width={80} height={12} borderRadius={6} />
            </div>
            <Skeleton height={10} width="100%" borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton height={10} width="80%" borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton height={22} width="50%" borderRadius={6} />
          </div>
        </div>
      </div>
      {/* Card 2 */}
      <div style={{ background: "var(--surface)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid var(--border)" }}>
        <Skeleton height={12} width="35%" borderRadius={6} style={{ marginBottom: 16 }} />
        <Skeleton height={10} width="100%" borderRadius={6} style={{ marginBottom: 10 }} />
        <Skeleton height={8} width="100%" borderRadius={99} style={{ marginBottom: 14 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Skeleton height={64} borderRadius={10} />
          <Skeleton height={64} borderRadius={10} />
        </div>
      </div>
      {/* Card 3 */}
      <div style={{ background: "var(--surface)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid var(--border)" }}>
        <Skeleton height={12} width="45%" borderRadius={6} style={{ marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Skeleton height={110} borderRadius={12} />
          <Skeleton height={110} borderRadius={12} />
        </div>
      </div>
    </div>
  );
}
