import { fileURLToPath, URL } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import { nitro } from "nitro/vite";
import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const plugins = [vinext()];
  const isVercelPreset = process.env.NITRO_PRESET === "vercel";

  if (process.env.NITRO_PRESET) {
    plugins.push(nitro());
  } else {
    plugins.push(
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      }),
    );
  }

  return {
    plugins,
    resolve: isVercelPreset
      ? {
          alias: {
            "@/lib/prisma-client": fileURLToPath(
              new URL("./src/lib/prisma-client-node.ts", import.meta.url),
            ),
            "@noble/ciphers": fileURLToPath(
              new URL(
                "./node_modules/better-auth/node_modules/@noble/ciphers",
                import.meta.url,
              ),
            ),
          },
        }
      : undefined,
  };
});
