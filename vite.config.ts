import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        find: resolve(__dirname, 'find.html'),
      },
    },
  },
  plugins: [
    react(),
    {
      // dev 서버에서 /articles/, /about.html 등 정적 HTML을 SPA 대신 직접 서빙
      name: 'static-html-dev',
      apply: 'serve',
      configureServer(server) {
        const publicDir = join(process.cwd(), 'public')

        server.middlewares.use((req, res, next) => {
          const url = (req.url ?? '/').split('?')[0]

          let filePath: string | null = null

          if (url === '/find') {
            filePath = join(process.cwd(), 'find.html')
          } else if (url === '/articles' || url === '/articles/') {
            filePath = join(publicDir, 'articles', 'index.html')
          } else if (url.startsWith('/articles/') && url.endsWith('.html')) {
            filePath = join(publicDir, url)
          } else if (url.startsWith('/articles/') && !url.includes('.')) {
            filePath = join(publicDir, url + '.html')
          } else if (['/about.html', '/contact.html', '/privacy.html'].includes(url)) {
            filePath = join(publicDir, url)
          } else if (['/about', '/contact', '/privacy'].includes(url)) {
            filePath = join(publicDir, url + '.html')
          }

          if (filePath && existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(readFileSync(filePath))
            return
          }

          next()
        })
      },
    },
  ],
})
