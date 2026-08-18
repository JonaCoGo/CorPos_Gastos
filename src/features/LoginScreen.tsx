import { useState } from "react";
import { loginWithGoogle } from "../services/auth";

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("[LoginScreen] Error:", err.code, err.message);
      if (err.code === "auth/popup-closed-by-user") {
        setError(null);
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Dominio no autorizado. Configuralo en Firebase Console → Authentication → Configuración.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Google login no está habilitado. Activarlo en Firebase Console → Authentication → Sign-in method.");
      } else if (err.code === "auth/popup-blocked-by-browser") {
        setError("El navegador bloqueó el popup. Permití popups para este sitio.");
      } else {
        setError(`Error: ${err.code || err.message || "desconocido"}`);
      }
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
        maxWidth: 380, width: "100%", textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
        <div style={{
          fontSize: 28, fontWeight: 900, fontFamily: "'Sora', sans-serif",
          letterSpacing: "-0.02em", marginBottom: 6,
        }}>
          Cor<span style={{ color: "var(--accent)" }}>Pos</span>
        </div>
        <div style={{
          fontSize: 14, color: "var(--text2)", marginBottom: 32,
          fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
        }}>
          Gastos familiares<br />organizados, juntos.
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "14px 20px", borderRadius: 12,
            border: "1.5px solid var(--border)", background: "var(--surface2)",
            cursor: loading ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
            color: "var(--text1)", transition: "all 0.15s",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "Conectando..." : "Entrar con Google"}
        </button>

        {error && (
          <div style={{
            marginTop: 16, padding: "10px 14px", borderRadius: 10,
            background: "rgba(220,38,38,0.08)", color: "var(--danger)",
            fontSize: 13, fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <div style={{
          marginTop: 24, fontSize: 11, color: "var(--text2)",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Tus datos están protegidos y solo son visibles para tu familia.
        </div>
      </div>
    </div>
  );
}
