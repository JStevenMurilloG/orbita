import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Módulos autorizados a usar el cliente con clave secreta (plan §31). */
const ADMIN_CLIENT_ALLOWED = [
  "src/lib/supabase/admin.ts",
  "src/features/google-drive/**",
  "src/features/notifications/jobs/**",
  "src/app/api/cron/**",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ADMIN_CLIENT_ALLOWED,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message:
                "El cliente admin salta RLS. Solo se permite en google-drive, cron y purgas (ver eslint.config.mjs).",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "supabase/functions/**",
  ]),
]);

export default eslintConfig;
