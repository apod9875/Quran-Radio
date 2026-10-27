// Serves web/ on a fixed port for `npx e2e run` (same server and CSP headers as the Playwright tests).
import { startStaticServer } from '../web/helpers/static-server.mjs';

const { url } = await startStaticServer({ port: 4173 });
console.log(`Quran Radio served at ${url}`);
