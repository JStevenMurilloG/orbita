# ADR-0008: Recordatorios con pg_cron e idempotencia por `dedupe_key`

- Estado: aceptado
- Fecha: 2026-09-25

## Decisión

`pg_cron` ejecuta cada 5 min `generate_task_reminders()`, que inserta notificaciones con `ON CONFLICT (dedupe_key) DO NOTHING`, donde `dedupe_key = task:{id}:off:{offset}:due:{epoch(due_at)}`. Entregas por canal en `notification_deliveries` con `UNIQUE (notification_id, channel)`.

## Consecuencias

Ejecutar el job N veces produce exactamente una notificación por (tarea, offset, vencimiento). Cambiar la fecha genera claves nuevas y cancela las anteriores.
