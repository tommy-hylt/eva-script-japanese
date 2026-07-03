import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVIES } from './movie-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const APP_DATA_DIR = path.join(ROOT, '..', 'web', 'src', 'data');

const TIME_RE = /^\d{2}:\d{2}:\d{2}\.\d{3}$/;

let hasFailures = false;

for (const movie of MOVIES) {
  const movieDir = path.join(APP_DATA_DIR, movie.id);
  const files = (await fs.readdir(movieDir))
    .filter((name) => name.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const allEntries = [];
  const fileCounts = [];

  for (const file of files) {
    const filePath = path.join(movieDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      fail(`${movie.id}/${file}: file does not contain a JSON array`);
      continue;
    }

    fileCounts.push(data.length);
    allEntries.push(...data);
  }

  const seenIds = new Set();
  let emptyEnglish = 0;
  let rubySegments = 0;
  let invalidEntries = 0;
  let previousTime = null;

  for (const entry of allEntries) {
    const issues = [];

    if (typeof entry.id !== 'string' || entry.id.length === 0) {
      issues.push('missing id');
    } else if (seenIds.has(entry.id)) {
      issues.push(`duplicate id ${entry.id}`);
    } else {
      seenIds.add(entry.id);
    }

    if (typeof entry.time !== 'string' || !TIME_RE.test(entry.time)) {
      issues.push(`invalid time ${String(entry.time)}`);
    }

    if (typeof entry.timeEnd !== 'string' || !TIME_RE.test(entry.timeEnd)) {
      issues.push(`invalid timeEnd ${String(entry.timeEnd)}`);
    }

    const currentTime = typeof entry.time === 'string' && TIME_RE.test(entry.time)
      ? parseClock(entry.time)
      : null;
    if (currentTime !== null && previousTime !== null && currentTime < previousTime) {
      issues.push('times not sorted');
    }
    if (currentTime !== null) {
      previousTime = currentTime;
    }

    if (!Array.isArray(entry.segments) || entry.segments.length === 0) {
      issues.push('segments missing or empty');
    } else {
      let visibleText = '';
      for (const segment of entry.segments) {
        if (typeof segment === 'string') {
          visibleText += segment;
          continue;
        }
        if (
          typeof segment !== 'object' ||
          typeof segment.kanji !== 'string' ||
          typeof segment.reading !== 'string' ||
          segment.kanji.length === 0 ||
          segment.reading.length === 0
        ) {
          issues.push('invalid ruby segment');
          continue;
        }
        rubySegments += 1;
        visibleText += segment.kanji;
      }
      if (!visibleText.trim()) {
        issues.push('segments render empty text');
      }
    }

    if (typeof entry.character !== 'string') {
      issues.push('character is not a string');
    }

    if (typeof entry.english !== 'string') {
      issues.push('english is not a string');
    } else if (!entry.english.trim()) {
      emptyEnglish += 1;
    }

    if (issues.length > 0) {
      invalidEntries += 1;
      fail(`${movie.id}/${entry.id ?? 'unknown'}: ${issues.join(', ')}`);
    }
  }

  console.log(
    `${movie.id}: ${files.length} parts, counts=${fileCounts.join(', ')}, total=${allEntries.length}, emptyEnglish=${emptyEnglish}, rubySegments=${rubySegments}, invalidEntries=${invalidEntries}`,
  );
}

if (hasFailures) {
  process.exitCode = 1;
}

function fail(message) {
  hasFailures = true;
  console.error(`FAIL ${message}`);
}

function parseClock(clock) {
  const [hms, millis = '0'] = clock.split('.');
  const [hours, minutes, seconds] = hms.split(':').map(Number);
  return (hours * 3600) + (minutes * 60) + seconds + (Number(millis) / 1000);
}
