import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function devApiPlugin(): Plugin {
  return {
    name: "dev-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api")) {
          return next();
        }
        try {
          const { handleDevApiRequest } = await server.ssrLoadModule("/src/dev-api-dispatcher.ts");
          const handled = await handleDevApiRequest(req, res);
          if (!handled) next();
        } catch (err: any) {
          console.error("[dev-api-middleware error]:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    react(),
    devApiPlugin(),
  ],
  server: {
    port: 3001,
    allowedHosts: ["localhost", "127.0.0.1", "nzoai.com", "nzoai.railway.internal"],
  },
});
