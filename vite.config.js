// This is a simplified vite config for production deployment
import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

// Dynamically check if plugin is available and use it
let reactPlugin = { name: 'react-fallback' };
try {
  // Try to dynamically import the React plugin
  const reactPath = path.resolve('./node_modules/@vitejs/plugin-react/dist/index.js');
  if (fs.existsSync(reactPath)) {
    const reactModule = await import('./node_modules/@vitejs/plugin-react/dist/index.js');
    if (reactModule && reactModule.default) {
      reactPlugin = reactModule.default();
    }
  }
} catch (error) {
  console.warn('Could not load @vitejs/plugin-react, using fallback configuration');
}

export default defineConfig({
  plugins: [
    // Add the react plugin if available
    reactPlugin,
  ],
  resolve: {
    alias: {
      "@": path.resolve("./client/src"),
      "@shared": path.resolve("./shared"),
      "@assets": path.resolve("./attached_assets"),
    },
  },
  root: path.resolve("./client"),
  build: {
    outDir: path.resolve("./dist/public"),
    emptyOutDir: true,
  },
});