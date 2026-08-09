import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// stellar-sdk still expects a `global` identifier in a few transitive deps.
export default defineConfig({
	plugins: [react()],
	define: {
		global: "globalThis",
	},
	server: {
		port: 5173,
		open: false,
	},
})
