import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      // Spring Boot API (your backend)
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },

      // Keycloak (OIDC endpoints)
      "/realms": {
        target: "http://localhost:9090",
        changeOrigin: true,
      },
      "/resources": {
        target: "http://localhost:9090",
        changeOrigin: true,
      },
      "/js": {
        target: "http://localhost:9090",
        changeOrigin: true,
      },
    },
  },
});
