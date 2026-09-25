# ADR-0006: Modelo temporal

- Estado: aceptado
- Fecha: 2026-09-25

## Decisión

- Instantes: `timestamptz`. Fechas civiles: `date`. Horario recurrente: `time` + `weekday` + zona IANA del trimestre (`terms.timezone`).
- "Hoy" se calcula siempre con `profiles.timezone`, nunca con la hora del servidor (Vercel corre en UTC).
- `tasks.due_at` lo calcula un trigger a partir de `due_date`, `due_time` y `due_tz`.
- Utilidades de fecha con `date-fns` v4 + `@date-fns/tz`.

## Consecuencias

Los cambios de horario de verano se respetan. Tests con reloj falso en `America/Bogota`, `America/New_York` y `Europe/Madrid`.
