import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/** Thay `__SITE_URL__` trong index.html bằng VITE_SITE_URL (vd. https://thiep.example.com) */
function siteUrlPlugin(siteUrl: string): Plugin {
  const clean = siteUrl.replace(/\/+$/, '')
  return {
    name: 'inject-site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', clean),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), siteUrlPlugin(env.VITE_SITE_URL ?? '')],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
