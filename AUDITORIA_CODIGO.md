# Auditoría técnica — CorPos APP Gastos

Fecha: 2026-06-30  
Alcance: revisión estática del código, configuración, build, type-check, dependencias y riesgos operativos/seguridad.

## Resumen ejecutivo

La app compila para producción (`npm.cmd run build`), pero no pasa TypeScript (`npx.cmd tsc --noEmit`) y tiene un problema crítico de seguridad: Firestore permite lectura y escritura pública. Para una app financiera/familiar con salarios, gastos y nombres reales, esto debe corregirse antes de considerar la app segura para producción.

Prioridad recomendada:

1. Cerrar Firestore con Firebase Auth y reglas por usuario/familia.
2. Corregir errores TypeScript y bug de notificaciones.
3. Actualizar dependencias vulnerables.
4. Quitar sourcemaps de producción o restringirlos.
5. Corregir codificación mojibake en textos/emoji.
6. Mejorar arquitectura de sincronización para evitar pérdida de datos por sobrescritura.

## Hallazgos críticos

### 1. Firestore está completamente abierto

- Archivo: `firestore.rules`
- Línea relevante: `allow read, write: if true;`
- Impacto: cualquier persona o script con datos del proyecto Firebase puede leer, modificar o borrar el documento compartido `corpos/shared`.
- Severidad: crítica.
- Evidencia adicional: `PLAN_MEJORAS.md` reconoce que Auth y datos privados están pendientes.

Recomendación:

- Implementar Firebase Auth.
- Cambiar el modelo de datos de un documento global (`corpos/shared`) a rutas por usuario/familia, por ejemplo `families/{familyId}/data/months/{monthId}`.
- Aplicar reglas con membresía:
  - Solo usuarios autenticados.
  - Solo miembros de la familia.
  - Validación mínima de esquema y tipos.

Ejemplo conceptual:

```txt
match /families/{familyId}/{document=**} {
  allow read, write: if request.auth != null
    && exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
}
```

### 2. Documento global compartido para todos los datos

- Archivo: `src/constants.ts`
- Línea relevante: `FIRESTORE_DOC = "corpos/shared"`
- Impacto: todos los clientes sincronizan contra el mismo documento, sin aislamiento por usuario, familia, ambiente o tenant.
- Severidad: crítica si la app se comparte con más personas.

Recomendación:

- Separar `familyId`, `userId` y ambiente (`dev`, `prod`).
- Evitar que staging/dev escriban sobre producción.
- Considerar subcolecciones por mes para reducir tamaño y conflictos.

## Bugs confirmados

### 3. TypeScript no pasa

Comando ejecutado:

```bash
npx.cmd tsc --noEmit
```

Errores:

- `src/App.tsx`: falta declaración de tipos para `virtual:pwa-register/react`.
- `src/features/TabFamilyExpenses.tsx`: parámetro `v` implícitamente `any`.
- `src/hooks/useNotifications.ts`: `FamilyExpense` no tiene propiedad `paid`.

Impacto:

- La build Vite pasa, pero el código no cumple el modo estricto declarado en `tsconfig.json`.
- Se pueden esconder bugs reales porque producción no está ejecutando type-check.

Recomendación:

- Agregar script `"typecheck": "tsc --noEmit"` y hacerlo parte de CI/build.
- Corregir el hook de notificaciones para no usar `paid` en `FamilyExpense`, o agregar explícitamente ese estado al modelo si el producto realmente lo necesita.
- Añadir `vite-plugin-pwa/client` o declaración de tipos para el virtual module.

### 4. Notificaciones de hogar usan una propiedad inexistente

- Archivo: `src/hooks/useNotifications.ts`
- Líneas relevantes: filtros por `e.paid` sobre `familyExpenses`.
- Modelo real: `FamilyExpense` tiene `marcela`, `jonatan`, `conjunto`, `budget`, `monthlyAmount`, pero no `paid`.

Impacto:

- Como `e.paid` es `undefined`, `!e.paid` evalúa `true`, entonces casi todos los gastos del hogar pueden considerarse pendientes siempre.
- El resumen semanal puede calcular 0% pagado aunque existan pagos registrados.

Recomendación:

- Definir “pagado” como `pagado >= montoEsperado`, usando `monthlyAmount ?? budget`.
- Para `mercado`, sumar totales de compras.
- O agregar `paid: boolean` al modelo y UI si se quiere manejar estado manual.

### 5. Código inválido/sospechoso en hint de gastos del hogar

- Archivo: `src/features/TabFamilyExpenses.tsx`
- Línea relevante: `Number(v => v)`

Impacto:

- No rompe build porque produce `NaN`, pero la expresión no tiene sentido y el `hint` siempre queda inútil.
- Es una señal de parche generado sin intención clara.

Recomendación:

- Eliminar esa línea si no aporta.
- O implementar validación real: “pagado excede monto del mes”, “falta cubrir”, “número negativo no permitido”.

## Seguridad

### 6. Dependencias con vulnerabilidades

Comandos ejecutados:

```bash
npm.cmd audit --omit=dev
npm.cmd audit
```

Resultados:

- Producción: 10 vulnerabilidades, 1 alta, asociadas principalmente a `undici` vía Firebase.
- Total: 12 vulnerabilidades, incluyendo `esbuild` vía Vite en dev.
- Versiones instaladas detectadas:
  - `firebase`: `10.14.1`
  - `vite`: `5.4.21`
  - `esbuild`: `0.21.5`
  - `undici`: `6.19.7`

Recomendación:

- Ejecutar `npm audit fix` y validar.
- Si no alcanza, actualizar Firebase a una versión segura compatible.
- Planificar upgrade de Vite mayor con prueba manual de PWA.

### 7. Sourcemaps de producción habilitados

- Archivo: `vite.config.js`
- Línea relevante: `sourcemap: true`

Impacto:

- Publica mapas de fuente que facilitan inspeccionar código, lógica interna, nombres de variables y estructura.
- No es secreto por sí mismo, pero aumenta superficie de análisis para terceros.

Recomendación:

- En producción pública: `sourcemap: false`.
- Si necesitas debugging: generar sourcemaps ocultos/subidos a una herramienta privada, no servidos públicamente.

### 8. Persistencia de datos financieros en localStorage

- Archivo: `src/services/firestore.ts`
- Líneas relevantes: lectura/escritura de `localStorage`.

Impacto:

- Cualquier script que corra en el origen puede leer salarios/gastos.
- Si algún día se introduce XSS, extensiones maliciosas o scripts de terceros, los datos quedan expuestos.

Recomendación:

- Mantener localStorage solo como cache si aceptan el riesgo.
- Evitar scripts de terceros innecesarios.
- Considerar IndexedDB con capa de cifrado local si el modelo de privacidad lo exige.

### 9. Fuentes externas desde Google Fonts

- Archivo: `src/layouts/MainLayout.tsx`
- Línea relevante: `@import url('https://fonts.googleapis.com/...')`

Impacto:

- Dependencia externa en runtime, tracking superficial de IP/User-Agent hacia Google y posible fallo offline.

Recomendación:

- Auto-hospedar fuentes si privacidad/offline importa.
- O usar stack de fuentes del sistema.

## Operación y confiabilidad

### 10. Sin control de concurrencia ni resolución de conflictos

- Archivos: `src/services/firestore.ts`, `src/store/useAppStore.ts`
- Patrón actual: cada cambio hace `setDoc` del objeto completo.

Impacto:

- Si dos dispositivos editan casi al tiempo, gana el último write y puede sobrescribir cambios.
- El listener remoto reemplaza todo el estado local.

Recomendación:

- Dividir datos por entidad/mes/subcolección.
- Usar `updateDoc`, transacciones o timestamps por registro.
- Añadir `updatedAt`, `updatedBy`, `schemaVersion`.
- Implementar cola offline/merge o al menos aviso de conflicto.

### 11. Firestore guarda todo el estado como un único documento

Impacto:

- Escala mal por tamaño de documento.
- Dificulta reglas por entidad.
- Hace más probable perder cambios simultáneos.

Recomendación:

- `months/{monthKey}`, `mercado/items/{itemId}`, `mercado/compras/{compraId}`, `config`.
- Esto también permite lecturas parciales y reglas más finas.

### 12. Build no ejecuta type-check

- Archivo: `package.json`
- Script actual: `"build": "vite build"`

Impacto:

- Producción puede compilar aunque TypeScript tenga errores.

Recomendación:

- Cambiar a `"build": "tsc --noEmit && vite build"`.
- Agregar `"typecheck": "tsc --noEmit"`.

### 13. Advertencia de chunk grande

Build reportó:

- Chunk principal: ~501 kB minificado.

Impacto:

- Carga inicial más pesada, especialmente móvil.

Recomendación:

- Separar Firebase en chunk propio.
- Revisar imports de `lucide-react`.
- Configurar `manualChunks` para `vendor`, `firebase`, `ui`.

## Diseño y UX

### 14. Mojibake/codificación rota en textos y emojis

Evidencia:

- Textos como `GestiÃ³n`, `AÃ±adir`, `ðŸ...` aparecen en múltiples archivos.

Impacto:

- UX deteriorada.
- Riesgo de que strings/emoji se rendericen mal en producción o documentación.

Recomendación:

- Normalizar archivos a UTF-8.
- Reparar textos fuente.
- Asegurar editor y Git configurados para UTF-8.

### 15. Formularios aceptan valores no validados

Impacto:

- Fechas, días del mes, montos negativos o decimales raros pueden entrar según el campo.
- IDs basados en `Date.now()` pueden colisionar en operaciones rápidas o simultáneas.

Recomendación:

- Validar montos `>= 0`.
- Validar días `1..31`.
- Usar `crypto.randomUUID()` para IDs.
- Centralizar parseo monetario.

### 16. Modales sin focus trap

- Archivo: `src/components/ui/Modal.tsx`

Impacto:

- Accesibilidad incompleta en teclado/lectores.

Recomendación:

- Mover foco al modal al abrir.
- Bloquear tabulación fuera del modal.
- Restaurar foco al cerrar.

## Pruebas recomendadas

Actualmente no se observan tests configurados.

Recomendación mínima:

- Tests unitarios para `computeSummary`, `calculateMercadoTotals`, `createEmptyMonth`.
- Tests de regresión para:
  - mercado pagado por persona/fondo conjunto,
  - carry-over de gastos al siguiente mes,
  - `disableNext`,
  - resumen con `monthlyAmount`,
  - notificaciones.

## Validaciones ejecutadas

```bash
npm.cmd run build
```

Resultado: exitoso, con advertencia de chunk grande y sourcemaps generados.

```bash
npx.cmd tsc --noEmit
```

Resultado: falla con 4 errores.

```bash
npm.cmd audit --omit=dev
npm.cmd audit
```

Resultado: vulnerabilidades detectadas en dependencias.

## Plan de remediación sugerido

### Semana 1 — Seguridad base

- Implementar Firebase Auth.
- Reescribir reglas Firestore.
- Migrar documento global a ruta por familia.
- Desactivar sourcemaps públicos.

### Semana 2 — Correctitud

- Hacer que `npm run build` ejecute type-check.
- Corregir notificaciones de hogar.
- Eliminar/implementar validación real en `Number(v => v)`.
- Reparar codificación UTF-8.

### Semana 3 — Operación

- Actualizar dependencias.
- Dividir Firestore en documentos/subcolecciones.
- Añadir `schemaVersion`, migraciones y backups/export.

### Semana 4 — Calidad

- Agregar tests unitarios de finanzas.
- Añadir lint/format.
- Mejorar accesibilidad de modales.
- Optimizar chunks.

