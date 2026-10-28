import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  plugins: [
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        maskPath: "/",
        prerender: { outputPath: "/index" },
      },
    }),
    react(),
    ...(process.env["CAPACITOR_BUILD"] === "true"
      ? []
      : [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.png", "logo.png", "cover.png"],
            manifest: {
              id: "/",
              lang: "pt-BR",
              name: "Ateliê",
              short_name: "Ateliê",
              description:
                "Organize pedidos, clientes, prazos de entrega e pagamentos do seu ateliê de costura, mesmo sem internet.",
              theme_color: "#f7f3ee",
              background_color: "#f7f3ee",
              display: "standalone",
              start_url: "/",
              scope: "/",
              orientation: "portrait",
              categories: ["productivity", "lifestyle"],
              icons: [
                {
                  src: "/favicon.png",
                  sizes: "1024x1024",
                  type: "image/png",
                },
                {
                  src: "/logo.png",
                  sizes: "1024x1024",
                  type: "image/png",
                  purpose: "any maskable",
                },
              ],
            },
          }),
        ]),
  ],
});
