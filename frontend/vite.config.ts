import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		checker({
			typescript: true // full-project TS checking
		})
	],
	build: {
		outDir: 'build'
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	}
});
