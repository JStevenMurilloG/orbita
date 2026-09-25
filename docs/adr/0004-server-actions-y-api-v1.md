# ADR-0004: Server Actions para la web + `/api/v1` para clientes externos

- Estado: aceptado
- Fecha: 2026-09-25

## Decisión

La web muta datos con Server Actions que devuelven `Result<T>`. Una API REST `/api/v1` expone las mismas operaciones para futuros clientes (PWA, móvil, integraciones). Ambos transportes llaman a la **misma** capa `features/*/service.ts`; ninguno duplica reglas.

## Consecuencias

- Cada acción: `requireUser()` → `schema.parse()` → `service` → `Result`.
- La API REST se construye incrementalmente, empezando por lo imprescindible (OAuth, descargas, cron).
