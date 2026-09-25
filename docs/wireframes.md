# Wireframes de baja fidelidad (Fase 0)

Referencia para las Fases 3–6. Validan la jerarquía y la regla de "pocos clics" (plan §22): desde **Hoy**, una clase del día = 1 clic; una tarea próxima = 1 clic; crear tarea = 1 clic + formulario.

Convenciones: `[Botón]`, `(icono)`, `▾` desplegable, `☐/☑` casilla, `●` color de la clase.

---

## 1. Hoy (dashboard) — Fase 5 + Fase 6

### Desktop (≥ 1024 px)

```
┌───────────────┬──────────────────────────────────────────────────────────────┐
│ (◎) Órbita    │  HOY — MIÉRCOLES 30 DE SEPTIEMBRE                  [+ Tarea] │
│               │  Segundo trimestre · 2026                                     │
│ [Segundo tri▾]│                                                               │
│               │  CLASES DE HOY                                                │
│ ☀ Hoy         │  ┌──────────────────────────────────────────────────────────┐ │
│ 📘 Clases      │  │ ● 08:00–10:00  📐 Cálculo II · Aula 204   EN CURSO       │ │
│ 🕘 Horario     │  │                                     [Entrar a clase →]   │ │
│ 📅 Calendario  │  ├──────────────────────────────────────────────────────────┤ │
│ ☑ Tareas      │  │ ● 10:30–12:00  🧪 Química · Lab 3         SIGUIENTE      │ │
│ 📓 Cuadernos   │  ├──────────────────────────────────────────────────────────┤ │
│ ───────────   │  │ ● 14:00–16:00  📖 Literatura · Aula 101                  │ │
│ Trimestres    │  └──────────────────────────────────────────────────────────┘ │
│ Configuración │                                                               │
│               │  PRÓXIMAS ENTREGAS                                            │
│               │  ⚠ Vencidas (1)                                               │
│               │   ☐ Taller 3 · Física            venció ayer      [URGENTE]   │
│               │  ● Hoy (1)                                                    │
│               │   ☐ Informe de lab · Química     hoy 23:59                    │
│               │  ● Mañana (2)                                                 │
│ (☀/☾) (👤)     │   ☐ Ejercicios 4.2 · Cálculo II  mañana                       │
│               │  ● Esta semana (3)  …                         [Ver todas →]   │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

### Móvil (< 768 px)

```
┌─────────────────────────────┐
│ (◎) Órbita   [Segundo tri ▾]│
├─────────────────────────────┤
│ HOY — MIÉRCOLES 30 SEP      │
│                             │
│ ┌─────────────────────────┐ │
│ │● 08:00 📐 Cálculo II     │ │
│ │  Aula 204 · EN CURSO   → │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │● 10:30 🧪 Química      → │ │
│ └─────────────────────────┘ │
│                             │
│ PRÓXIMAS ENTREGAS           │
│ ⚠ ☐ Taller 3 · ayer         │
│ ● ☐ Informe lab · hoy       │
│ ● ☐ Ejercicios 4.2 · mañana │
│                        (+)  │ ← botón flotante "+ Tarea"
├─────────────────────────────┤
│ Hoy  Clases  Calend.  Tareas│
└─────────────────────────────┘
```

Estados vacíos: sin trimestre → "Crea tu primer trimestre" `[Crear trimestre]`; sin clases → `[Añadir clase]`; sin horario → `[Configurar horario]`; día libre → "Hoy no tienes clases"; trimestre fuera de fechas → "Este trimestre terminó el 12 dic." `[Cambiar trimestre]`.

---

## 2. Espacio de clase — Fase 3

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Clases                                                             │
│ ● 📐 Cálculo II   MAT-204 · Aula 204 · 4 créditos       [Editar] [⋯] │
│ ──────────────────────────────────────────────────────────────────── │
│ Resumen | Tareas | Cuadernos | Documentos | Horario | Profesor       │
│ ──────────────────────────────────────────────────────────────────── │
│ PRÓXIMAS SESIONES            │ DOCENTE                               │
│  Lun 08:00–10:00 · Aula 204  │  Dra. Ana Pérez                       │
│  Mié 08:00–10:00 · Aula 204  │  ✉ ana.perez@uni.edu  (mailto)        │
│                              │  ☎ +57 300 000 0000   (tel)           │
│ TAREAS PENDIENTES (3)        │  Oficina B-12 · Mar 14–16             │
│  ☐ Ejercicios 4.2  mañana    │                                       │
│  ☐ Parcial 2       en 5 días │ ÚLTIMOS CUADERNOS (MVP2)              │
│  [+ Tarea]                   │  —                                    │
└──────────────────────────────────────────────────────────────────────┘
```

Móvil: pestañas con scroll horizontal; Resumen en una sola columna (docente debajo de tareas).

---

## 3. Horario — Fase 4

### Desktop: rejilla semanal

```
        Lun          Mar          Mié          Jue          Vie      Sáb  Dom
 07:00
 08:00 ┌─────────┐              ┌─────────┐
       │● Cálc II│              │● Cálc II│
 09:00 │ A-204   │ ┌─────────┐  │ A-204   │
 10:00 └─────────┘ │● Física │  └─────────┘ ┌─────────┐
                   │ A-310   │              │● Química│
 11:00             └─────────┘              │ Lab 3   │
 12:00                                      └─────────┘
 …
                                                        [+ Añadir bloque]
```

Clic en un hueco → formulario prellenado (día y hora). Solapamiento → aviso amarillo "Se solapa con Física (lun 09:00–11:00)", no bloquea.

### Móvil: lista por día

```
LUNES
 ● 08:00–10:00  Cálculo II · A-204
 ● 09:00–11:00  Física · A-310   ⚠ solapa
MARTES
 (sin clases)
…
```

---

## 4. Tareas — Fase 6

```
┌──────────────────────────────────────────────────────────────────────┐
│ Tareas                                                    [+ Tarea]  │
│ [Clase ▾] [Estado: Pendientes ▾] [Prioridad ▾]   Pendientes|Completadas│
│ ──────────────────────────────────────────────────────────────────── │
│ ⚠ VENCIDAS                                                           │
│  ☐ Taller 3               ● Física      venció ayer     [URGENTE]    │
│ HOY                                                                  │
│  ☐ Informe de lab         ● Química     hoy 23:59                    │
│ MAÑANA                                                               │
│  ☐ Ejercicios 4.2         ● Cálculo II  jue 1 oct                    │
│ ESTA SEMANA · FUTURAS · SIN FECHA …                                  │
└──────────────────────────────────────────────────────────────────────┘
```

Clic en una tarea → panel lateral (Sheet) con título, clase, fecha/hora, prioridad, descripción y notas. Completar: casilla optimista + toast "Tarea completada · [Deshacer]". En móvil, el panel ocupa la pantalla completa.
