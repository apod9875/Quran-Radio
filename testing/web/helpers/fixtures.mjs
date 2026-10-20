// Recorded copies of the live mp3quran station lists (ids, names and stream URLs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TESTDATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../testdata');

export function readRadios(lang) {
  return JSON.parse(fs.readFileSync(path.join(TESTDATA, `radios_${lang}.json`), 'utf8')).radios;
}
