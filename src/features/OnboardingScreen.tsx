import { useState } from "react";
import { createFamily, joinFamily } from "../services/familyService";
import { AuthUser } from "../services/auth";
import { AppData } from "../types/models";

interface OnboardingScreenProps {
  user: AuthUser;
  existingData: AppData | null;
  onDone: (familyId: string) => void;
}

export function OnboardingScreen({ user, existingData, onDone }: OnboardingScreenProps) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasExistingData = existingData && Object.keys(existingData.months || {}).length > 0;

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const familyId = await createFamily(
        user.uid,
        familyName.trim(),
        user.displayName || "Sin nombre",
        user.email || "",
        hasExistingData ? existingData : undefined
      );
      onDone(familyId);
    } catch {
      setError("No se pudo crear la familia. Intentá de nuevo.");
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const familyId = await joinFamily(
        user.uid,
        code,
        user.displayName || "Sin nombre",
        user.email || ""
      );
      onDone(familyId);
    } catch (err: any) {
      setError(err.message || "Código no válido. Verificá e intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
      `}</style>
      <div style={{
        background: "var(--surface)", borderRadius: 24, padding: "40px 32px",
        maxWidth: 400, width: "100%",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        {mode === "choose" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
              <div style={{
                fontSize: 20, fontWeight: 800, fontFamily: "'Sora', sans-serif",
                letterSpacing: "-0.01em", marginBottom: 6,
              }}>
                ¡Bienvenido{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                {hasExistingData
                  ? "Detectamos datos existentes. ¿Querés crear una familia con esos datos o unirte a otra?"
                  : "Para empezar, creá tu familia o unite a una existente."
                }
              </div>
            </div>

            <button onClick={() => setMode("create")} style={{
              width: "100%", padding: "16px", borderRadius: 14, border: "none",
              background: "var(--accent)", color: "#fff", cursor: "pointer",
              fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              🏠 Crear mi familia
            </button>

            <button onClick={() => setMode("join")} style={{
              width: "100%", padding: "16px", borderRadius: 14,
              border: "1.5px solid var(--border)", background: "var(--surface2)",
              color: "var(--text1)", cursor: "pointer",
              fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              🔗 Unirme a una familia
            </button>
          </>
        )}

        {mode === "create" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Sora', sans-serif", marginBottom: 6 }}>
                Crear familia
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", fontFamily: "'DM Sans', sans-serif" }}>
                Poné el nombre de tu familia. Después podés compartir un código para que otros se unan.
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 6 }}>
                Nombre de la familia
              </div>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                placeholder="Ej: Familia Corrales"
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid var(--border)", background: "var(--surface2)",
                  color: "var(--text1)", fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                  outline: "none",
                }}
              />
            </div>

            {hasExistingData && (
              <div style={{
                padding: "10px 14px", borderRadius: 10, background: "rgba(79,70,229,0.07)",
                border: "1px solid rgba(79,70,229,0.2)", marginBottom: 14,
                fontSize: 12, color: "var(--accent)", fontWeight: 600, lineHeight: 1.5,
              }}>
                ✅ Se transferirán los datos que ya tenés registrados a esta familia.
              </div>
            )}

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10, background: "rgba(220,38,38,0.08)",
                color: "var(--danger)", fontSize: 13, fontWeight: 500, marginBottom: 14,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setMode("choose"); setError(null); }} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid var(--border)",
                background: "var(--surface2)", color: "var(--text2)", cursor: "pointer",
                fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              }}>
                Volver
              </button>
              <button onClick={handleCreate} disabled={!familyName.trim() || loading} style={{
                flex: 2, padding: "12px", borderRadius: 12, border: "none",
                background: familyName.trim() && !loading ? "var(--accent)" : "var(--border)",
                color: "#fff", cursor: familyName.trim() && !loading ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              }}>
                {loading ? "Creando..." : "Crear familia"}
              </button>
            </div>
          </>
        )}

        {mode === "join" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Sora', sans-serif", marginBottom: 6 }}>
                Unirse a familia
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", fontFamily: "'DM Sans', sans-serif" }}>
                Pedile el código de 6 caracteres a quien creó la familia.
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 6 }}>
                Código de invitación
              </div>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
                placeholder="Ej: A3X7K2"
                autoFocus
                maxLength={6}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid var(--border)", background: "var(--surface2)",
                  color: "var(--text1)", fontSize: 18, fontWeight: 700,
                  fontFamily: "'DM Sans', monospace", letterSpacing: "0.15em",
                  textAlign: "center", outline: "none",
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10, background: "rgba(220,38,38,0.08)",
                color: "var(--danger)", fontSize: 13, fontWeight: 500, marginBottom: 14,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setMode("choose"); setError(null); }} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid var(--border)",
                background: "var(--surface2)", color: "var(--text2)", cursor: "pointer",
                fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              }}>
                Volver
              </button>
              <button onClick={handleJoin} disabled={inviteCode.trim().length !== 6 || loading} style={{
                flex: 2, padding: "12px", borderRadius: 12, border: "none",
                background: inviteCode.trim().length === 6 && !loading ? "var(--accent)" : "var(--border)",
                color: "#fff", cursor: inviteCode.trim().length === 6 && !loading ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              }}>
                {loading ? "Uniendo..." : "Unirme"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
