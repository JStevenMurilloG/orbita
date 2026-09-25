# ADR-0011: Tiptap con contenido JSON y autosave con concurrencia optimista

- Estado: aceptado
- Fecha: 2026-09-25

## Decisión

El editor es Tiptap; el contenido se guarda como JSON (`notes.content`, con `schema_version`). El autosave envía `base_version`; si no coincide con la del servidor responde `409 VERSION_CONFLICT`. Borrador local en IndexedDB y revisiones en `note_revisions`.

## Consecuencias

Sin pérdidas entre pestañas/dispositivos. El texto plano para búsqueda lo recalcula el servidor.
