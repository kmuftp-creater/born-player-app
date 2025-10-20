import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [
            react(),
            // 這是我們為了修正 PDF 上傳問題而加入的，務必保留
            viteStaticCopy({
                targets: [
                    {
                        src: 'node_modules/pdfjs-dist/build/pdf.worker.mjs',
                        dest: '.'
                    }
                ]
            })
        ],
        // 這是您專案原本就有的關鍵設定，我們現在要用回這個設定
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});
