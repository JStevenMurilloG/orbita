"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100dvh",
          margin: 0,
          padding: 16,
        }}
      >
        <title>Error · Órbita</title>
        <div role="alert" style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: 20 }}>Algo salió mal</h1>
          <p>Ya lo estamos revisando. Inténtalo de nuevo en un momento.</p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: 12 }}>ID de error: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={() => retry()}
            style={{ padding: "8px 16px", marginTop: 8 }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
