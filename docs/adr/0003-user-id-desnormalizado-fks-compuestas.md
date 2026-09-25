# ADR-0003: `user_id` desnormalizado + FKs compuestas

- Estado: aceptado
- Fecha: 2026-09-25

## Contexto

Una política RLS que solo compruebe `user_id` no impide que un usuario enlace su fila a un padre ajeno (p. ej. crear una tarea en la clase de otro) si conoce su UUID.

## Decisión

Todas las tablas de dominio llevan `user_id` (`DEFAULT auth.uid()`). Cada padre expone `UNIQUE (id, user_id)` y cada hijo referencia `(parent_id, user_id)` con una FK compuesta. Donde importa la coherencia de trimestre, `UNIQUE (id, term_id, user_id)`.

## Consecuencias

- Es imposible, a nivel de BD, enlazar recursos de otro usuario o de otro trimestre.
- Políticas RLS simples y rápidas (`user_id = (select auth.uid())`).
- Algo más de almacenamiento e índices; aceptable.
