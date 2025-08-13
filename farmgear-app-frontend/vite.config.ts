import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [react()],
    // 降低 Vite 控制台噪声
    logLevel: 'warn',
    resolve: {
      alias: [
        {
          find: '@',
          replacement: resolve(__dirname, 'src'),
        },
      ],
    },
    // 只在开发环境启用HTTPS
    server: isDev
      ? {
          https: fs.existsSync(resolve(__dirname, 'certs/localhost-key.pem'))
            ? {
                key: fs.readFileSync(resolve(__dirname, 'certs/localhost-key.pem')),
                cert: fs.readFileSync(resolve(__dirname, 'certs/localhost.pem')),
              }
            : undefined,
          port: 5173,
          host: true,
        }
      : undefined,
    // 生产环境构建优化
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-form', '@radix-ui/react-toast'],
            utils: ['axios', 'clsx', 'tailwind-merge', '@tanstack/react-query'],
          },
        },
      },
    },
  };
});
