import { useEffect, useMemo, useState, useCallback, useRef, Suspense, lazy } from "react";
import { Capacitor } from "@capacitor/core";
import { useRegisterSW } from "virtual:pwa-register/react";
import { db } from "./firebase";
import { MONTH_NAMES, SW_LAST_CHECK_KEY } from "./constants";
import { computeSummary } from "./utils/finanzas";
import { useAppStore } from "./store/useAppStore";
import { onAuthChange, handleRedirectResult } from "./services/auth";
import { getUserFamilyId } from "./services/familyService";
import MainLayout from "./layouts/MainLayout";
import { Toast, AppSkeleton } from "./components/ui";
import { LoginScreen } from "./features/LoginScreen";
import { OnboardingScreen } from "./features/OnboardingScreen";
import { TabMore } from "./features/TabMore";
import { useNotifications } from "./hooks/useNotifications";
import { useOtaUpdate } from "./hooks/useOtaUpdate";

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

function PwaUpdater() {
  useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const checkForUpdate = () => {
        localStorage.setItem(SW_LAST_CHECK_KEY, new Date().toISOString());
        registration.update().catch(() => {});
      };
      checkForUpdate();
      setInterval(checkForUpdate, SW_UPDATE_CHECK_INTERVAL_MS);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });
    },
  });
  return null;
}

const TabDashboard        = lazy(() => import("./features/TabDashboard").then((m) => ({ default: m.TabDashboard })));
const TabFamilyExpenses   = lazy(() => import("./features/TabFamilyExpenses").then((m) => ({ default: m.TabFamilyExpenses })));
const TabPersonalExpenses = lazy(() => import("./features/TabPersonalExpenses").then((m) => ({ default: m.TabPersonalExpenses })));
const TabHistory          = lazy(() => import("./features/TabHistory").then((m) => ({ default: m.TabHistory })));
const TabExtras           = lazy(() => import("./features/TabExtras").then((m) => ({ default: m.TabExtras })));
const TabMercado          = lazy(() => import("./features/TabMercado").then((m) => ({ default: m.TabMercado })));
const TabSettings         = lazy(() => import("./features/TabSettings").then((m) => ({ default: m.TabSettings })));

export default function App() {
  useOtaUpdate();

  const data   = useAppStore((s) => s.data);
  const tab    = useAppStore((s) => s.tab);
  const synced = useAppStore((s) => s.synced);
  const user   = useAppStore((s) => s.user);
  const familyId = useAppStore((s) => s.familyId);
  const setTab               = useAppStore((s) => s.setTab);
  const updateMercado        = useAppStore((s) => s.updateMercado);
  const updateMonth          = useAppStore((s) => s.updateMonth);
  const selectMonth          = useAppStore((s) => s.selectMonth);
  const addMonth             = useAppStore((s) => s.addMonth);
  const deleteMonth          = useAppStore((s) => s.deleteMonth);
  const checkAndAdvanceMonth = useAppStore((s) => s.checkAndAdvanceMonth);
  const initFirestoreSync    = useAppStore((s) => s.initFirestoreSync);
  const setAuth              = useAppStore((s) => s.setAuth);
  const setFamilyId          = useAppStore((s) => s.setFamilyId);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => setToast(msg), []);

  // ── Auth listener ───────────────────────────────────────────────────────
  const [authLoading, setAuthLoading] = useState(true);
  const authUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Procesar redirect de Google primero (Capacitor), DESPUÉS escuchar auth.
    // onAuthStateChanged se dispara automáticamente después de getRedirectResult.
    handleRedirectResult().then(() => {
      const unsub = onAuthChange(async (firebaseUser) => {
        console.log("[App] Auth state changed:", firebaseUser?.email ?? "(no user)");
        if (firebaseUser) {
          let fId: string | null = null;
          try {
            fId = await getUserFamilyId(firebaseUser.uid);
          } catch (err) {
            console.error("[App] Error reading user family:", (err as any).message);
          }
          setAuth(firebaseUser, fId);
        } else {
          setAuth(null, null);
        }
        setAuthLoading(false);
      });
      authUnsubRef.current = unsub;
    });

    return () => {
      authUnsubRef.current?.();
    };
  }, [setAuth]);

  // ── Firestore sync (solo cuando hay familyId) ───────────────────────────
  useEffect(() => {
    if (!familyId) return;
    const unsub = initFirestoreSync();
    return () => unsub();
  }, [familyId, initFirestoreSync]);

  // ── Auto-advance month ──────────────────────────────────────────────────
  useEffect(() => {
    checkAndAdvanceMonth();
  }, [data.currentKey, checkAndAdvanceMonth]);

  // ── Onboarding: crear/unir familia ──────────────────────────────────────
  const handleOnboardingDone = useCallback((newFamilyId: string) => {
    setFamilyId(newFamilyId);
    setTab("settings"); // nueva familia arranca en configuración
  }, [setFamilyId, setTab]);

  // ── Notifications ───────────────────────────────────────────────────────
  const currentMonth = data.months[data.currentKey];

  const summary = useMemo(
    () => (currentMonth ? computeSummary({ ...currentMonth, mercado: data.mercado }) : null),
    [currentMonth, data.mercado]
  );

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
  useNotifications(currentMonth ?? null, data.mercado ?? null, notifPermission);

  const syncStatus = !db ? "offline" : synced ? "synced" : "connecting";
  const monthLabel = currentMonth
    ? `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}`
    : "";
  const isNative = Capacitor.isNativePlatform();

  // ── Auth loading ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <>
        {!isNative && <PwaUpdater />}
        <MainLayout tab="dashboard" setTab={setTab} syncStatus="connecting" monthLabel="">
          <AppSkeleton />
        </MainLayout>
      </>
    );
  }

  // ── Login screen ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        {!isNative && <PwaUpdater />}
        <LoginScreen />
      </>
    );
  }

  // ── Onboarding screen ───────────────────────────────────────────────────
  if (!familyId) {
    return (
      <>
        {!isNative && <PwaUpdater />}
        <OnboardingScreen
          user={user}
          onDone={handleOnboardingDone}
        />
      </>
    );
  }

  // ── App normal ──────────────────────────────────────────────────────────
  if (!currentMonth) {
    return (
      <>
        {!isNative && <PwaUpdater />}
        <MainLayout tab={tab} setTab={setTab} syncStatus={syncStatus} monthLabel="">
          <AppSkeleton />
        </MainLayout>
      </>
    );
  }

  const withToast =
    (fn: (d: typeof currentMonth) => void, msg: string) =>
    (d: typeof currentMonth) => {
      fn(d);
      showToast(msg);
    };

  const renderTab = () => {
    switch (tab) {
      case "dashboard":
        return <TabDashboard monthData={currentMonth} summary={summary!} mercado={data.mercado} />;
      case "family":
        return (
          <TabFamilyExpenses
            monthData={currentMonth}
            mercado={data.mercado || { items: [], compras: [] }}
            onUpdate={withToast(updateMonth, "Gasto del hogar guardado")}
          />
        );
      case "extras":
        return (
          <TabExtras
            monthData={currentMonth}
            onUpdate={withToast(updateMonth, "Gasto extra guardado")}
          />
        );
      case "mercado":
        return (
          <TabMercado
            mercado={data.mercado || { items: [], compras: [] }}
            onUpdate={updateMercado}
          />
        );
      case "personal":
        return (
          <TabPersonalExpenses
            monthData={currentMonth}
            onUpdate={withToast(updateMonth, "Gasto personal guardado")}
          />
        );
      case "history":
        return (
          <TabHistory
            allMonths={data.months}
            currentKey={data.currentKey}
            mercado={data.mercado}
            onSelectMonth={selectMonth}
            onNewMonth={addMonth}
            onDeleteMonth={deleteMonth}
          />
        );
      case "settings":
        return <TabSettings onPermissionGranted={() => setNotifPermission("granted")} />;
      case "more":
        return <TabMore onGoTo={setTab} />;
      default:
        return null;
    }
  };

  return (
    <>
      {!isNative && <PwaUpdater />}
      <MainLayout tab={tab} setTab={setTab} syncStatus={syncStatus} monthLabel={monthLabel}>
        <Suspense fallback={<AppSkeleton />}>{renderTab()}</Suspense>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </MainLayout>
    </>
  );
}
