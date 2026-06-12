import { Avatar, ProgressBar, Card } from '../components/ui';
import { MONTH_NAMES } from '../constants';
import { COP } from '../utils/finanzas';

interface TabDashboardProps {
  monthData: any;
  summary: any;
}

export function TabDashboard({ monthData, summary }: TabDashboardProps) {
  const { ratio, totalNeto, netoMarcela, netoJonatan,
    personalTotalMarcela, personalTotalJonatan,
    extrasTotalMarcela, extrasTotalJonatan,
    totalFamilyBudget, totalFamilyPaid, totalFamilyPending,
    totalFamilyPaidMarcela, totalFamilyPaidJonatan,
    aporteFamiliarMarcela, aporteFamiliarJonatan,
    aportePagadoIdealMarcela, aportePagadoIdealJonatan,
    saldoMarcela, saldoJonatan, diffMarcela, diffJonatan } = summary;

  // Calcular faltantes para llegar al ideal
  const faltanteMarcela = Math.max(0, aporteFamiliarMarcela - totalFamilyPaidMarcela);
  const faltanteJonatan = Math.max(0, aporteFamiliarJonatan - totalFamilyPaidJonatan);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Salarios */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Salarios — {MONTH_NAMES[monthData.month]} {monthData.year}
        </div>
        {[
          { n: "marcela", bruto: monthData.salaries.marcela, personal: personalTotalMarcela, neto: netoMarcela },
          { n: "jonatan", bruto: monthData.salaries.jonatan, personal: personalTotalJonatan, neto: netoJonatan },
        ].map(({ n, bruto, personal, neto }) => (
          <div key={n} style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Avatar name={n} size={26} />
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>{n}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text2)" }}>{(ratio[n] * 100).toFixed(1)}% del aporte</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>Salario bruto</span>
                <span style={{ fontWeight: 600 }}>{COP(bruto)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>− Gastos personales</span>
                <span style={{ fontWeight: 600, color: "var(--danger)" }}>−{COP(personal)}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Neto disponible</span>
                <span style={{ fontSize: 17, fontWeight: 900, color: n === "marcela" ? "var(--marce)" : "var(--jona)", fontFamily: "var(--font-display)" }}>{COP(neto)}</span>
              </div>
            </div>
          </div>
        ))}
        <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>Total neto disponible</span>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{COP(totalNeto)}</span>
        </div>
      </Card>

      {/* Gastos familiares */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>Gastos del Hogar</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>Pagado</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{COP(totalFamilyPaid)} / {COP(totalFamilyBudget)}</span>
        </div>
        <ProgressBar value={totalFamilyPaid} max={totalFamilyBudget} height={10} />
        <div style={{ marginTop: 12 }}>
          {totalFamilyPending > 0 ? (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#92400e" }}>⏳ Por pagar</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#92400e" }}>{COP(totalFamilyPending)}</span>
            </div>
          ) : totalFamilyPaid > 0 ? (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>✅ ¡Todos los gastos cubiertos!</span>
            </div>
          ) : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          {[{ label: "Pagó Marcela", val: totalFamilyPaidMarcela, n: "marcela", ideal: aportePagadoIdealMarcela },
            { label: "Pagó Jonatan", val: totalFamilyPaidJonatan, n: "jonatan", ideal: aportePagadoIdealJonatan }].map(({ label, val, n, ideal }) => (
            <div key={n} style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: `var(--${n})` }}>{COP(val)}</div>
              <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 3 }}>Ideal: {COP(ideal)}</div>
            </div>
          ))}
        </div>
        {(faltanteMarcela >= 1000 || faltanteJonatan >= 1000) && (<div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>
            {faltanteMarcela >= 1000 && (<div style={{ color: "var(--danger)", marginBottom: 4 }}>
                Marcela le falta pagar {COP(faltanteMarcela)} para llegar al ideal</div>
            )}
            {faltanteJonatan >= 1000 && (<div style={{ color: "var(--danger)" }}>
                Jonatan le falta pagar {COP(faltanteJonatan)} para llegar al ideal</div>
            )}</div>
        )}
      </Card>

      {/* Saldo libre */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>Saldo Libre Estimado</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[{ n: "marcela", saldo: saldoMarcela, aporte: aporteFamiliarMarcela },
            { n: "jonatan", saldo: saldoJonatan, aporte: aporteFamiliarJonatan }].map(({ n, saldo, aporte }) => (
            <div key={n} style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Avatar name={n} size={24} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "capitalize" }}>{n}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>Aporte ideal al hogar</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{COP(aporte)}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>Gastos extra</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", marginBottom: 8 }}>−{COP(n === "marcela" ? extrasTotalMarcela : extrasTotalJonatan)}</div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>Queda libre</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: saldo >= 0 ? "var(--success)" : "var(--danger)", fontFamily: "var(--font-display)" }}>
                  {COP(saldo)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text2)", padding: "8px 10px", background: "#f0f4ff", borderRadius: 8 }}>
          Saldo libre = neto disponible − aporte proporcional al hogar
        </div>
      </Card>
    </div>
  );
}
