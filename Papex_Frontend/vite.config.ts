import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const copyWorker = () => {
  try {
    const workerSource = resolve('node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
    const workerDest = resolve('public/pdf.worker.min.mjs')
    
    if (existsSync(workerSource)) {
      copyFileSync(workerSource, workerDest)
      console.log('✓ PDF.js worker copied to public folder')
    }
  } catch (error) {
    console.warn('⚠ Failed to copy PDF.js worker:', error)
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-pdfjs-worker',
      buildStart() {
        // Copy PDF.js worker to public folder during build
        copyWorker()
      },
      configureServer() {
        // Copy worker when dev server starts
        copyWorker()
      },
    },
  ],
})