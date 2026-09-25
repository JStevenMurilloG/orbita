# ADR-0007: Google Drive con `drive.file` + Picker y referencias

- Estado: aceptado
- Fecha: 2026-09-25

## Decisión

Scope mínimo `drive.file` con Google Picker: la app solo accede a los archivos que el usuario elige. Los archivos se guardan como referencias (`documents.source = 'google_drive'`), no se copian. Tokens OAuth cifrados con AES-256-GCM en `google_tokens`, tabla con RLS sin políticas (solo service role).

## Consecuencias

Se evita la auditoría CASA de scopes restringidos. La verificación de la pantalla de consentimiento sigue requiriendo dominio propio y políticas publicadas.
