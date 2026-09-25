import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Zona fija del proceso para que ningún test dependa de la máquina (plan §27).
    env: { TZ: "UTC" },
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/features/**/{service,schemas}.ts"],
      exclude: ["src/lib/supabase/**", "src/lib/env*.ts", "**/*.test.*"],
    },
  },
});
