import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
// VITE_BASE is set by the GitHub workflow to "/<repo-name>/". Locally it defaults to relative paths.
export default defineConfig({ base: process.env.VITE_BASE || './', plugins: [react()], test: { environment: 'node' } });
