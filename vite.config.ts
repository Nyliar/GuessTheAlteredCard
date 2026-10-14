import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { reunionDevAuth } from "./server/reunionAuth";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      reunionDevAuth({
        clientId: env.VITE_REUNION_CLIENT_ID || "GuessTheAlteredCard",
        clientSecret: env.REUNION_CLIENT_SECRET || "",
      }),
    ],
    server: {
      port: 80,
      strictPort: true,
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
