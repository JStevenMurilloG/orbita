# ADR-0005: Calendario agregado en lectura

- Estado: aceptado
- Fecha: 2026-09-25

## Decisión

El calendario no copia tareas ni clases a `calendar_events`. Combina en lectura las ocurrencias del horario expandido, las tareas (por `due_at`) y los eventos propios.

## Consecuencias

Cambiar la fecha de una tarea actualiza el calendario sin sincronización. La expansión del horario debe ser eficiente y estar bien probada.
