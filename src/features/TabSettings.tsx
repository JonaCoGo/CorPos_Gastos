import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Bell, BellOff, Download, Upload, RefreshCw, LogOut, Share2 } from 'lucide-react';
import { Card, Btn, Field, Modal, Label } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { PaymentMethod, PaymentMethodType } from '../types/models';
import { requestNotifPermission, getNotifEnabled, setNotifEnabled } from '../hooks/useNotifications';
import { saveData } from '../services/firestore';
import { logout } from '../services/auth';
import { getInviteCode, regenerateInviteCode } from '../services/familyService';
import { SW_LAST_CHECK_KEY } from '../constants';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatRelative = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  return `hace ${Math.floor(hr / 24)} d`;
};

const TYPE_OPTIONS: { value: PaymentMethodType; label: string; icon: string }[] = [
  { value: "ahorro",   label: "Cuenta ahorro", icon: "🏦" },
  { value: "credito",  label: "Tarjeta crédito", icon: "💳" },
  { value: "efectivo", label: "Efectivo",       icon: "💵" },
];

const PRESET_COLORS = ["#FBBF24", "#820AD1", "#0ea5e9", "#059669", "#dc2626", "#6366f1", "#f59e0b", "#64748b"];

export function TabSettings({ onPermissionGranted }: { onPermissionGranted?: () => void }) {
  const config              = useAppStore((s) => s.data.config);
  const data                = useAppStore((s) => s.data);
  const familyId            = useAppStore((s) => s.familyId);
  const user                = useAppStore((s) => s.user);
  const updateConfig        = useAppStore((s) => s.updateConfig);
  const resetMercadoCompras = useAppStore((s) => s.resetMercadoCompras);
  const resetAllData        = useAppStore((s) => s.resetAllData);
  const comprasCount        = useAppStore((s) => s.data.mercado.compras.length);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess] = useState(false);

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.months || !parsed.currentKey) throw new Error("Formato inválido");
        saveData(parsed);
        window.location.reload();
      } catch {
        setImportError("El archivo no es válido. Asegúrate de usar un backup exportado desde esta app.");
        setTimeout(() => setImportError(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportBackup = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corpos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const names = { marcela: config?.marcelaName ?? "Marcela", jonatan: config?.jonatanName ?? "Jonatan" };
  const methods = config?.paymentMethods ?? [];
  const supermarkets = config?.supermarkets ?? [];

  const [marcelaName, setMarcelaName] = useState(names.marcela);
  const [jonatanName, setJonatanName] = useState(names.jonatan);
  const [saved,        setSaved]       = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [resetAllInput, setResetAllInput] = useState("");

  // Notificaciones
  const notifSupported = 'Notification' in window;
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    notifSupported ? Notification.permission : 'denied'
  );
  const [notifEnabled, setNotifEnabledState] = useState(getNotifEnabled());

  const handleRequestNotif = async () => {
    const perm = await requestNotifPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      setNotifEnabled(true);
      setNotifEnabledState(true);
      localStorage.removeItem('corpos_notif_last_check');
      onPermissionGranted?.();
    }
  };

  const toggleNotifEnabled = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    setNotifEnabledState(next);
  };

  // Medios de pago
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodForm, setMethodForm] = useState<{ label: string; type: PaymentMethodType; owner: 'marcela' | 'jonatan' | 'conjunto'; color: string }>({
    label: "", type: "ahorro", owner: "marcela", color: "#FBBF24",
  });

  const handleSaveNames = () => {
    const trimM = marcelaName.trim() || "Marcela";
    const trimJ = jonatanName.trim() || "Jonatan";
    updateConfig({ ...config, marcelaName: trimM, jonatanName: trimJ });
    setMarcelaName(trimM);
    setJonatanName(trimJ);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => { resetMercadoCompras(); setConfirmReset(false); };

  const handleResetAll = async () => {
    await resetAllData();
    // Limpiar localStorage de esta familia para que al recargar no se carguen datos viejos
    if (familyId) {
      localStorage.removeItem(`corpos_budget_v6_${familyId}`);
    }
    setConfirmResetAll(false);
    setResetAllInput("");
    window.location.reload();
  };

  // Versión de la app / última revisión de actualización
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const lastCheck = localStorage.getItem(SW_LAST_CHECK_KEY);
  void now; // fuerza re-render periódico para que "hace X min" se mantenga actualizado
  const [justChecked, setJustChecked] = useState(false);

  const checkNow = () => {
    // Actualizamos el timestamp y el feedback visual de inmediato — no depende
    // de que la promesa de abajo resuelva ni de que haya un SW registrado.
    localStorage.setItem(SW_LAST_CHECK_KEY, new Date().toISOString());
    setNow(Date.now());
    setJustChecked(true);
    setTimeout(() => setJustChecked(false), 2000);

    // Best-effort: si hay un service worker registrado, pedirle que revise si hay versión nueva.
    navigator.serviceWorker?.getRegistration()
      .then((reg) => reg?.update())
      .catch(() => {});
  };

  const addMethod = () => {
    if (!methodForm.label.trim()) return;
    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      label: methodForm.label.trim(),
      type: methodForm.type,
      owner: methodForm.owner,
      color: methodForm.color,
      active: true,
    };
    updateConfig({ ...config, paymentMethods: [...methods, newMethod] });
    setShowAddMethod(false);
    setMethodForm({ label: "", type: "ahorro", owner: "marcela", color: "#FBBF24" });
  };

  const deleteMethod = (id: string) => {
    updateConfig({ ...config, paymentMethods: methods.filter((m) => m.id !== id) });
  };

  // Supermercados
  const [newSupermarket, setNewSupermarket] = useState("");

  const addSupermarket = () => {
    const name = newSupermarket.trim();
    if (!name || supermarkets.includes(name)) return;
    updateConfig({ ...config, supermarkets: [...supermarkets, name] });
    setNewSupermarket("");
  };

  const deleteSupermarket = (name: string) => {
    updateConfig({ ...config, supermarkets: supermarkets.filter((s) => s !== name) });
  };

  const ownerLabel = (owner: string) => owner === "marcela" ? names.marcela : owner === "jonatan" ? names.jonatan : "Los dos";
  const typeInfo = (type: string) => TYPE_OPTIONS.find((t) => t.value === type);

  // ── Compartir familia (invite code) ─────────────────────────────────────
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    if (familyId) {
      getInviteCode(familyId).then(setInviteCode).catch(() => {});
    }
  }, [familyId]);

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch {
      // fallback: seleccionar texto
    }
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!familyId || !user) return;
    setInviteLoading(true);
    try {
      const newCode = await regenerateInviteCode(familyId, user.uid);
      setInviteCode(newCode);
    } catch {
      // silently fail
    }
    setInviteLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Nombres */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Nombres a mostrar
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
          Personaliza cómo aparecen los nombres en la app.
        </div>
        <Field label="Persona 1" value={marcelaName} onChange={setMarcelaName} type="text" placeholder="Nombre" />
        <Field label="Persona 2" value={jonatanName} onChange={setJonatanName} type="text" placeholder="Nombre" />
        <Btn variant="primary" onClick={handleSaveNames} disabled={saved} style={{ width: "100%" }}>
          {saved ? "✅ Guardado" : "Guardar nombres"}
        </Btn>
      </Card>

      {/* Medios de pago */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>
            Medios de pago
          </div>
          <button onClick={() => setShowAddMethod(true)} aria-label="Añadir medio de pago"
            style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-body)" }}>
            <Plus size={14} /> Añadir
          </button>
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
          Registra las cuentas y tarjetas con las que pagan para rastrear de dónde sale cada gasto.
        </div>

        {methods.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text2)", fontSize: 13 }}>
            Sin medios de pago configurados
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {methods.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface2)", borderRadius: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{typeInfo(m.type)?.icon} {m.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{typeInfo(m.type)?.label} · {ownerLabel(m.owner)}</div>
                </div>
                <button onClick={() => deleteMethod(m.id)} aria-label={`Eliminar ${m.label}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: "4px", display: "flex", alignItems: "center" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Supermercados */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Supermercados
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
          Lugares donde suelen hacer mercado. Aparecen como opciones al registrar un viaje.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <input
              value={newSupermarket}
              onChange={(e) => setNewSupermarket(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addSupermarket(); }}
              placeholder="Ej: Justo y Bueno"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none" }}
            />
          </div>
          <button onClick={addSupermarket} disabled={!newSupermarket.trim()} aria-label="Añadir supermercado"
            style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "0 14px", cursor: newSupermarket.trim() ? "pointer" : "not-allowed", opacity: newSupermarket.trim() ? 1 : 0.5, fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)" }}>
            <Plus size={14} /> Añadir
          </button>
        </div>
        {supermarkets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text2)", fontSize: 13 }}>
            Sin supermercados configurados
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {supermarkets.map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 6px 6px 12px", background: "var(--surface2)", borderRadius: 99 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s}</span>
                <button onClick={() => deleteSupermarket(s)} aria-label={`Eliminar ${s}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: "4px", display: "flex", alignItems: "center" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notificaciones */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Notificaciones
        </div>
        {!notifSupported ? (
          <div style={{ fontSize: 13, color: "var(--text2)" }}>Tu navegador no soporta notificaciones.</div>
        ) : notifPermission === 'denied' ? (
          <div style={{ fontSize: 13, color: "var(--danger)" }}>
            Notificaciones bloqueadas por el navegador. Permítelas en la configuración del sitio y recarga la app.
          </div>
        ) : notifPermission === 'default' ? (
          <div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
              Activa las notificaciones para recibir recordatorios de gastos pendientes, resumen semanal y aviso de cierre de mes.
            </div>
            <Btn variant="primary" onClick={handleRequestNotif} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Bell size={16} /> Activar notificaciones
            </Btn>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
              Las notificaciones se envían al abrir la app si hay gastos pendientes, los domingos como resumen semanal, y los últimos 3 días del mes.
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--surface2)", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {notifEnabled ? <Bell size={16} color="var(--accent)" /> : <BellOff size={16} color="var(--text2)" />}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{notifEnabled ? "Activas" : "Pausadas"}</span>
              </div>
              <button onClick={toggleNotifEnabled} style={{
                background: notifEnabled ? "var(--accent)" : "var(--border)",
                border: "none", borderRadius: 20, width: 44, height: 24, cursor: "pointer",
                position: "relative", transition: "background 0.2s",
              }} aria-label={notifEnabled ? "Pausar notificaciones" : "Activar notificaciones"}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 3, transition: "left 0.2s",
                  left: notifEnabled ? 23 : 3,
                }} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Backup */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Copia de seguridad
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
          Descarga todos tus datos en un archivo JSON. Guárdalo en un lugar seguro como respaldo.
        </div>
        <Btn variant="secondary" onClick={handleExportBackup} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
          <Download size={16} /> Descargar backup
        </Btn>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} style={{ display: "none" }} />
        <Btn variant="secondary" onClick={() => fileInputRef.current?.click()} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Upload size={16} /> Restaurar desde backup
        </Btn>
        {importError && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(220,38,38,0.1)", borderRadius: 8, fontSize: 13, color: "var(--danger)" }}>
            {importError}
          </div>
        )}
        {importSuccess && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(5,150,105,0.1)", borderRadius: 8, fontSize: 13, color: "var(--success)" }}>
            ✅ Backup restaurado correctamente
          </div>
        )}
      </Card>

      {/* Reset mercado */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Reinicio del mercado
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>
          Borra todas las compras registradas y deja la lista de productos lista para empezar el mes. Los productos, categorías y precios base <strong>no se eliminan</strong>.
        </div>
        {comprasCount > 0 ? (
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14, padding: "8px 12px", background: "var(--surface2)", borderRadius: 8 }}>
            {comprasCount} compra{comprasCount !== 1 ? "s" : ""} registrada{comprasCount !== 1 ? "s" : ""} actualmente
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--success)", marginBottom: 14, padding: "8px 12px", background: "var(--surface2)", borderRadius: 8 }}>
            ✅ Sin compras — el mercado ya está en cero
          </div>
        )}
        <Btn variant="danger" onClick={() => setConfirmReset(true)} disabled={comprasCount === 0} style={{ width: "100%" }}>
          Reiniciar compras del mercado
        </Btn>
      </Card>

      {/* Compartir familia */}
      {familyId && inviteCode && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
            <Share2 size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Compartir familia
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
            Compartí este código con quien quieras agregar a tu familia. Al ingresarlo, podrán ver y editar los mismos datos.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{
              flex: 1, padding: "12px 16px", borderRadius: 10, background: "var(--surface2)",
              fontFamily: "monospace", fontSize: 22, fontWeight: 800, letterSpacing: "0.2em",
              textAlign: "center", color: "var(--accent)",
            }}>
              {inviteCode}
            </div>
            <button onClick={handleCopyCode} style={{
              padding: "0 16px", borderRadius: 10, border: "1.5px solid var(--border)",
              background: inviteCopied ? "var(--success)" : "var(--surface2)",
              color: inviteCopied ? "#fff" : "var(--text1)", cursor: "pointer",
              fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)",
            }}>
              {inviteCopied ? "✅" : "Copiar"}
            </button>
          </div>
          <Btn variant="secondary" onClick={handleRegenerateCode} disabled={inviteLoading} style={{ width: "100%" }}>
            {inviteLoading ? "Generando..." : "🔄 Regenerar código"}
          </Btn>
        </Card>
      )}

      {/* Versión de la app */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Versión de la app
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>Versión instalada</span>
            <span style={{ fontWeight: 700 }}>{formatDateTime(__BUILD_TIME__)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>Última revisión de actualización</span>
            <span style={{ fontWeight: 700 }}>{lastCheck ? formatRelative(lastCheck) : "aún no revisada"}</span>
          </div>
        </div>
        <Btn variant="secondary" onClick={checkNow} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {justChecked ? <>✅ Revisado</> : <><RefreshCw size={16} /> Revisar ahora</>}
        </Btn>
      </Card>

      {/* Zona de peligro */}
      <Card style={{ border: "1.5px solid rgba(220,38,38,0.3)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--danger)", marginBottom: 14 }}>
          Zona de peligro
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
          Borra <strong>todo</strong>: nombres, salarios, medios de pago, supermercados, gastos del hogar, personales, extras, compras del mercado y el historial completo de meses. Solo queda el catálogo de productos del mercado. Tendrán que volver a configurar todo desde cero. <strong>No se puede deshacer.</strong>
        </div>
        <Btn variant="danger" onClick={() => setConfirmResetAll(true)} style={{ width: "100%" }}>
          Reiniciar todos mis datos
        </Btn>
      </Card>

      {/* Cerrar sesión */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Sesión
        </div>
        {user && (
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, padding: "10px 14px", background: "var(--surface2)", borderRadius: 10 }}>
            <div style={{ fontWeight: 700, color: "var(--text1)" }}>{user.displayName || user.email}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{user.email}</div>
          </div>
        )}
        <Btn variant="danger" onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <LogOut size={16} /> Cerrar sesión
        </Btn>
      </Card>

      {/* Modal: añadir medio de pago */}
      <Modal open={showAddMethod} onClose={() => setShowAddMethod(false)} title="Nuevo medio de pago">
        <Field label="Nombre" value={methodForm.label} onChange={(v) => setMethodForm({ ...methodForm, label: v })} type="text" placeholder="Ej: Bancolombia, Nu, Efectivo…" />

        <div style={{ marginBottom: 14 }}>
          <Label>Tipo</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {TYPE_OPTIONS.map((t) => (
              <button key={t.value} onClick={() => setMethodForm({ ...methodForm, type: t.value })} style={{
                padding: "10px 8px", borderRadius: 10, border: "2px solid",
                borderColor: methodForm.type === t.value ? "var(--accent)" : "var(--border)",
                background: methodForm.type === t.value ? "rgba(79,70,229,0.1)" : "var(--surface2)",
                cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                color: methodForm.type === t.value ? "var(--accent)" : "var(--text2)",
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <Label>¿De quién?</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {(["marcela", "jonatan", "conjunto"] as const).map((o) => (
              <button key={o} onClick={() => setMethodForm({ ...methodForm, owner: o })} style={{
                padding: "10px 6px", borderRadius: 10, border: "2px solid",
                borderColor: methodForm.owner === o ? "var(--accent)" : "var(--border)",
                background: methodForm.owner === o ? "rgba(79,70,229,0.1)" : "var(--surface2)",
                cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                color: methodForm.owner === o ? "var(--accent)" : "var(--text2)",
              }}>
                {o === "marcela" ? names.marcela : o === "jonatan" ? names.jonatan : "Los dos"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <Label>Color</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setMethodForm({ ...methodForm, color: c })} aria-label={c} style={{
                width: 30, height: 30, borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                outline: methodForm.color === c ? `3px solid ${c}` : "none",
                outlineOffset: 2,
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setShowAddMethod(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={addMethod} disabled={!methodForm.label.trim()} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Modal: confirmar reset mercado */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="¿Reiniciar mercado?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 8 }}>
          Se eliminarán <strong>{comprasCount} compra{comprasCount !== 1 ? "s" : ""}</strong> del historial.
        </p>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Los productos, categorías y precios base quedan intactos.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmReset(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={handleReset} style={{ flex: 1 }}>Sí, reiniciar</Btn>
        </div>
      </Modal>

      {/* Modal: confirmar reset total */}
      <Modal open={confirmResetAll} onClose={() => { setConfirmResetAll(false); setResetAllInput(""); }} title="¿Reiniciar todos los datos?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 8 }}>
          Se borrará <strong>todo</strong>: nombres, salarios, medios de pago, supermercados, gastos del hogar, personales, extras, compras y el historial completo de meses.
        </p>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Solo queda el catálogo de productos del mercado. Esta acción no se puede deshacer.
        </p>
        <Field
          label='Escribí "REINICIAR" para confirmar'
          value={resetAllInput}
          onChange={setResetAllInput}
          type="text"
          placeholder="REINICIAR"
        />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => { setConfirmResetAll(false); setResetAllInput(""); }} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={handleResetAll} disabled={resetAllInput.trim().toUpperCase() !== "REINICIAR"} style={{ flex: 1 }}>Sí, borrar todo</Btn>
        </div>
      </Modal>
    </div>
  );
}
