import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["react-window"],
  },
  build: {
    outDir:'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI and Animation libraries
          'ui-vendor': ['framer-motion', 'lucide-react'],
          
          // Charts and Data Visualization
          'charts-vendor': ['recharts', 'react-sparklines'],
          
          // Form and Table libraries
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'table-vendor': ['@tanstack/react-table'],
          
          // Grid and DnD libraries
          'grid-vendor': ['react-grid-layout', '@dnd-kit/core', '@dnd-kit/sortable'],
          
          // Date and File utilities
          'utils-vendor': ['date-fns', 'react-date-range', 'file-saver', 'xlsx', 'html2canvas'],
          
          // State management and HTTP
          'state-vendor': ['zustand', 'axios'],
          
          // Other utilities
          'misc-vendor': ['uuid', 'react-select']
        }
      }
    },
    
    chunkSizeWarningLimit: 1000
  },
  
  
})
