import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

export default defineConfig(() => {
  return {
    plugins: [tsconfigPaths()],
    test: {
      environment: 'node',
    },
    env: {
      ...config({ path: '.env.test' }).parsed,
    },
  }
})
