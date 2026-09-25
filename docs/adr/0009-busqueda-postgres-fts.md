# ADR-0009: Búsqueda con PostgreSQL FTS

- Estado: aceptado
- Fecha: 2026-09-25

## Decisión

Columnas `tsvector` generadas (configuración `spanish` + `unaccent`) e índices GIN, más `pg_trgm` en títulos. RPC `search_all` `SECURITY INVOKER` para que RLS aplique.

## Consecuencias

Sin motor externo ni sincronización de índices. Si el volumen crece mucho, se reevaluará Meilisearch/Typesense.
