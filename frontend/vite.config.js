import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: { "@": resolve(__dirname, "./src") },
    },
    build: {
        outDir: "../build",
        rollupOptions: {
            input: {
                main: resolve(__dirname, "pages/index.html"),
                // Add other pages here
                about: resolve(__dirname, "pages/about.html"),
            },
            output: {
                assetFileNames: (assetInfo) => {
                    let extType = assetInfo.name.split(".").at(1);
                    if (/png|jpg|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                        extType = "img";
                    }
                    return `static/${extType}/[name]-[hash][extname]`;
                },
                chunkFileNames: "static/js/[name]-[hash].js",
                entryFileNames: "static/js/[name]-[hash].js",
            },
        },
        emptyOutDir: true,
        copyPublicDir: false,
    },
    server: {
        watch: {
            usePolling: true, // Useful for Docker or WSL
        },
    },
});
