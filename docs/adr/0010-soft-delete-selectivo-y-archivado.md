# ADR-0010: Soft delete selectivo y trimestres archivados como solo lectura

- Estado: aceptado
- Fecha: 2026-09-25

## Decisión

- `deleted_at` solo en `courses`, `tasks`, `notebooks`, `notes`, `documents` (papelera de 30 días + purga).
- Los trimestres no se borran por defecto: se finalizan y archivan. Un trimestre `archived` es de solo lectura, garantizado por el trigger `assert_term_writable()` en las tablas hijas (error `TERM_ARCHIVED`).
- `status` (ciclo de vida) es distinto de `profiles.active_term_id` (selección del usuario).
