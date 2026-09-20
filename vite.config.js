import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api/auth": { target: "http://127.0.0.1:4183", changeOrigin: true },
      "/api/jobs": { target: "http://127.0.0.1:4175", changeOrigin: true },
      "/api/appointments": { target: "http://127.0.0.1:4176", changeOrigin: true },
      "/api/measurements": { target: "http://127.0.0.1:4177", changeOrigin: true },
      "/api/payments": { target: "http://127.0.0.1:4178", changeOrigin: true },
      "/api/assets": { target: "http://127.0.0.1:4179", changeOrigin: true },
      "/api/timeline": { target: "http://127.0.0.1:4180", changeOrigin: true },
      "/api/invoices": { target: "http://127.0.0.1:4181", changeOrigin: true },
      "/api/quotes": { target: "http://127.0.0.1:4182", changeOrigin: true },
      "/api/donna": { target: "http://127.0.0.1:4184", changeOrigin: true },
      "/api": { target: "http://127.0.0.1:4174", changeOrigin: true },
    },
  },
});