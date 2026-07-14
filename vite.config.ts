import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
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

          if (url === '/articles' || url === '/articles/') {
            filePath = join(publicDir, 'articles', 'index.html')
          } else if (url.startsWith('/articles/') && url.endsWith('.html')) {
            filePath = join(publicDir, url)
          } else if (['/about.html', '/contact.html', '/privacy.html'].includes(url)) {
            filePath = join(publicDir, url)
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
