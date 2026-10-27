import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

export default {
  tests: 'testing/e2e/**/*.e2e.ts',
  targets: [{
    engine: web(),
    app: {
      url: 'http://127.0.0.1:4173',
      command: { executable: 'node', args: ['testing/e2e/serve.mjs'], log: '.e2e/logs/app.log' },
    },
  }],
} satisfies E2EConfig;
