import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    build: {
        manifest: true,
        outDir: 'public/build',
    },
    resolve: {
        alias: [
            {
                find: /^~(.*)$/,
                replacement: '$1',
            },
        ],
    },
    define: {
        'process.env.NODE_ENV': '"production"',
        'process.env.PDFJS_WORKER_URL': JSON.stringify('/build/pdf.worker.min.js'),
    },
    optimizeDeps: {
        include: ['react-pdf'],
    },
});