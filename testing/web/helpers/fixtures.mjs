// Recorded copies of the live mp3quran API answers (radios, reciters, surah names).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TESTDATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../testdata');

export function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(TESTDATA, `${name}.json`), 'utf8'));
}

export function readRadios(lang = 'ar') {
  return readFixture(`radios_${lang}`).radios;
}

export function readReciters() {
  return readFixture('reciters_ar').reciters;
}

export function readSuwar() {
  return readFixture('suwar_ar').suwar;
}
