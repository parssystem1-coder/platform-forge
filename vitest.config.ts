import { defineConfig } from 'vitest/config';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Load .env file for tests */
function loadTestEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    console.log('[vitest] Loading environment from:', envPath);
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
          if (key.includes('DATABASE')) {
            console.log(`[vitest] ✓ Set ${key}`);
          }
        }
      }
    }
    console.log('[vitest] DATABASE_URL_APP:', process.env.DATABASE_URL_APP || '(not set)');
  }
}

loadTestEnv();

export default defineConfig({
  test: {
    include: [
      'tests/**/*.spec.ts',
      'handbook/90-skeleton/tests/**/*.spec.ts',
      'apps/api/src/**/*.spec.ts',
      'apps/worker/src/**/*.spec.ts',
      'packages/database/src/**/*.spec.ts',
    ],
    pool: 'forks',
  },
});
