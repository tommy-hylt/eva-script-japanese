import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMParser } from '@xmldom/xmldom';
import KuroshiroModule from 'kuroshiro';
import KuromojiAnalyzerModule from 'kuroshiro-analyzer-kuromoji';
import { MOVIES } from './movie-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'sources', 'ttml');
const APP_DATA_DIR = path.join(ROOT, '..', 'web', 'src', 'data');
const INTERMEDIATE_DIR = path.join(ROOT, 'workspace', 'intermediate');
const REPORT_DIR = path.join(ROOT, 'workspace', 'reports');
const OVERRIDE_DIR = path.join(ROOT, 'manual-overrides');

const parser = new DOMParser();
const Kuroshiro = KuroshiroModule.default ?? KuroshiroModule;
const KuromojiAnalyzer = KuromojiAnalyzerModule.default ?? KuromojiAnalyzerModule;
const kuroshiro = new Kuroshiro();

const KANJI_RE = /\p{sc=Han}/u;
const SPEAKER_RE = /^\uFF08([^\uFF09]+)\uFF09\s*/u;
const FULL_PAREN_LINE_RE = /^\uFF08.+\uFF09$/u;
const BRACKET_LINE_RE = /^\[[^\]]+\]$/u;

await kuroshiro.init(new KuromojiAnalyzer());

await fs.mkdir(APP_DATA_DIR, { recursive: true });
await fs.mkdir(INTERMEDIATE_DIR, { recursive: true });
await fs.mkdir(REPORT_DIR, { recursive: true });
await fs.mkdir(OVERRIDE_DIR, { recursive: true });

for (const movie of MOVIES) {
  const jpPath = path.join(SOURCE_DIR, `${movie.shortCode}-JP.ttml2`);
  const enPath = path.join(SOURCE_DIR, `${movie.shortCode}-EN.ttml2`);

  const jpEntries = await parseTtmlFile(jpPath, true);
  const enEntries = await parseTtmlFile(enPath, false);
  const overrides = await loadOverrides(movie.id);

  const preparedEntries = [];
  const report = {
    movieId: movie.id,
    titleEn: movie.titleEn,
    jpEntryCount: jpEntries.length,
    enEntryCount: enEntries.length,
    entriesWithoutEnglish: 0,
    entriesWithSourceRuby: 0,
    entriesWithGeneratedRuby: 0,
    carriedSpeakerEntries: 0,
    overriddenEntries: 0,
  };

  let previousSpeaker = '';
  let previousSpokenEnd = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < jpEntries.length; index += 1) {
    const jpEntry = jpEntries[index];
    const sourceRubyCount = countRubySegments(jpEntry.segments);
    const enrichedSegments = await enrichSegments(jpEntry.segments);
    const generatedRubyCount = countRubySegments(enrichedSegments) - sourceRubyCount;
    const extracted = extractCharacter(enrichedSegments);
    const visibleJapanese = normalizeWhitespace(segmentsToText(extracted.cleanedSegments));
    const cueOnly = isLikelyCueOnlyJapanese(visibleJapanese);

    let character = extracted.character;
    if (!character && !cueOnly && !jpEntry.isLyricLike && previousSpeaker && (jpEntry.beginSeconds - previousSpokenEnd) <= 6) {
      character = previousSpeaker;
      report.carriedSpeakerEntries += 1;
    }

    if (character && !cueOnly) {
      previousSpeaker = character;
      previousSpokenEnd = jpEntry.endSeconds;
    }

    if (sourceRubyCount > 0) {
      report.entriesWithSourceRuby += 1;
    }
    if (generatedRubyCount > 0) {
      report.entriesWithGeneratedRuby += 1;
    }

    preparedEntries.push({
      id: `${movie.id}-${String(index + 1).padStart(4, '0')}`,
      time: jpEntry.begin,
      timeEnd: jpEntry.end,
      beginSeconds: jpEntry.beginSeconds,
      endSeconds: jpEntry.endSeconds,
      isLyricLike: jpEntry.isLyricLike,
      character,
      segments: extracted.cleanedSegments,
      english: '',
    });
  }

  const englishAssignments = assignEnglishToJapanese(preparedEntries, enEntries);
  const alignedEntries = [];

  for (const entry of preparedEntries) {
    const english = dedupeLines((englishAssignments.get(entry.id) ?? []).map(normalizeWhitespace)).join('\n');
    const finalEntry = {
      id: entry.id,
      time: entry.time,
      timeEnd: entry.timeEnd,
      character: entry.character,
      segments: entry.segments,
      english,
    };

    const override = overrides[entry.id];
    if (override) {
      applyOverride(finalEntry, override);
      report.overriddenEntries += 1;
    }
    if (!finalEntry.english) {
      report.entriesWithoutEnglish += 1;
    }

    alignedEntries.push(finalEntry);
  }

  const parts = splitEntries(alignedEntries, movie.partCount);
  const movieDir = path.join(APP_DATA_DIR, movie.id);
  await fs.mkdir(movieDir, { recursive: true });

  for (let i = 0; i < parts.length; i += 1) {
    const partPath = path.join(movieDir, `part-${i + 1}.json`);
    await fs.writeFile(partPath, `${JSON.stringify(parts[i], null, 2)}\n`, 'utf8');
  }

  report.generatedPartCount = parts.length;
  report.partSizes = parts.map((part) => part.length);
  report.firstTime = alignedEntries[0]?.time ?? '';
  report.lastTime = alignedEntries.at(-1)?.timeEnd ?? '';

  await fs.writeFile(
    path.join(INTERMEDIATE_DIR, `${movie.id}-aligned.json`),
    `${JSON.stringify(alignedEntries, null, 2)}\n`,
    'utf8',
  );
  await fs.writeFile(
    path.join(REPORT_DIR, `${movie.id}-summary.json`),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
}

const manifest = {
  movies: MOVIES.map((movie) => ({
    id: movie.id,
    titleJa: movie.titleJa,
    titleEn: movie.titleEn,
    totalParts: movie.partCount,
  })),
};

await fs.writeFile(
  path.join(APP_DATA_DIR, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log('Dataset build complete.');

async function loadOverrides(movieId) {
  const filePath = path.join(OVERRIDE_DIR, `${movieId}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function parseTtmlFile(filePath, isJapanese) {
  const xml = await fs.readFile(filePath, 'utf8');
  const document = parser.parseFromString(xml, 'text/xml');
  const pNodes = Array.from(document.getElementsByTagName('p'));

  return pNodes.map((node) => {
    const begin = node.getAttribute('begin') ?? '00:00:00.000';
    const end = node.getAttribute('end') ?? begin;
    const region = node.getAttribute('region') ?? '';
    const style = node.getAttribute('style') ?? '';
    const segments = readSegments(node, isJapanese);
    const text = normalizeWhitespace(segmentsToText(segments));
    return {
      begin,
      end,
      beginSeconds: parseClock(begin),
      endSeconds: parseClock(end),
      region,
      style,
      isLyricLike: isJapanese && isLikelyLyricRegion(region, style, text),
      segments,
      text,
    };
  }).filter((entry) => entry.text.length > 0);
}

function readSegments(node, isJapanese) {
  const segments = [];

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === child.TEXT_NODE) {
      pushStringSegment(segments, child.nodeValue ?? '');
      continue;
    }

    if (child.nodeType !== child.ELEMENT_NODE) {
      continue;
    }

    if (child.tagName === 'br') {
      pushStringSegment(segments, '\n');
      continue;
    }

    if (isJapanese && child.getAttribute('style') === 's3') {
      const ruby = extractRuby(child);
      if (ruby) {
        segments.push(ruby);
        continue;
      }
    }

    for (const segment of readSegments(child, isJapanese)) {
      if (typeof segment === 'string') {
        pushStringSegment(segments, segment);
      } else {
        segments.push(segment);
      }
    }
  }

  return compactSegments(segments);
}

function extractRuby(node) {
  let kanji = '';
  let reading = '';

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType !== child.ELEMENT_NODE) {
      continue;
    }
    const style = child.getAttribute('style');
    if (style === 's4') {
      kanji += normalizeWhitespace(child.textContent ?? '');
    }
    if (style === 's5' || style === 's7') {
      reading += normalizeWhitespace(child.textContent ?? '');
    }
  }

  if (!kanji || !reading) {
    return null;
  }

  return { kanji, reading };
}

async function enrichSegments(segments) {
  const output = [];

  for (const segment of segments) {
    if (typeof segment !== 'string') {
      output.push(segment);
      continue;
    }

    if (!KANJI_RE.test(segment)) {
      pushStringSegment(output, segment);
      continue;
    }

    const generated = await convertStringToSegments(segment);
    for (const item of generated) {
      if (typeof item === 'string') {
        pushStringSegment(output, item);
      } else {
        output.push(item);
      }
    }
  }

  return compactSegments(output);
}

async function convertStringToSegments(text) {
  const html = await kuroshiro.convert(text, {
    mode: 'furigana',
    to: 'hiragana',
    format: 'html',
  });
  const wrapped = `<root>${html}</root>`;
  const document = parser.parseFromString(wrapped, 'text/xml');
  const root = document.getElementsByTagName('root')[0];
  return readRubyHtml(root);
}

function readRubyHtml(node) {
  const segments = [];

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === child.TEXT_NODE) {
      pushStringSegment(segments, child.nodeValue ?? '');
      continue;
    }
    if (child.nodeType !== child.ELEMENT_NODE) {
      continue;
    }

    if (child.tagName === 'ruby') {
      const rt = child.getElementsByTagName('rt')[0];
      const kanji = normalizeWhitespace(extractRubyBaseText(child));
      const reading = normalizeWhitespace(rt?.textContent ?? '');
      if (kanji && reading) {
        segments.push({ kanji, reading });
        continue;
      }
    }

    if (child.tagName === 'rp') {
      continue;
    }

    for (const segment of readRubyHtml(child)) {
      if (typeof segment === 'string') {
        pushStringSegment(segments, segment);
      } else {
        segments.push(segment);
      }
    }
  }

  return compactSegments(segments);
}

function extractRubyBaseText(rubyNode) {
  let text = '';

  for (const child of Array.from(rubyNode.childNodes)) {
    if (child.nodeType === child.TEXT_NODE) {
      text += child.nodeValue ?? '';
      continue;
    }
    if (child.nodeType !== child.ELEMENT_NODE) {
      continue;
    }
    if (child.tagName === 'rt' || child.tagName === 'rp') {
      continue;
    }
    text += child.textContent ?? '';
  }

  return text;
}

function extractCharacter(segments) {
  const text = segmentsToText(segments);
  const match = text.match(SPEAKER_RE);
  if (!match) {
    return { character: '', cleanedSegments: segments };
  }

  const remainder = text.slice(match[0].length);
  if (!remainder.trim()) {
    return { character: '', cleanedSegments: segments };
  }

  return {
    character: match[1].trim(),
    cleanedSegments: sliceSegmentsByTextLength(segments, match[0].length),
  };
}

function sliceSegmentsByTextLength(segments, skipLength) {
  let remaining = skipLength;
  const output = [];

  for (const segment of segments) {
    if (remaining <= 0) {
      output.push(segment);
      continue;
    }

    if (typeof segment === 'string') {
      if (segment.length <= remaining) {
        remaining -= segment.length;
        continue;
      }
      output.push(segment.slice(remaining));
      remaining = 0;
      continue;
    }

    if (segment.kanji.length <= remaining) {
      remaining -= segment.kanji.length;
      continue;
    }

    output.push(segment.kanji.slice(remaining));
    remaining = 0;
  }

  return compactSegments(output);
}

function assignEnglishToJapanese(jpEntries, enEntries) {
  const assignments = new Map(jpEntries.map((entry) => [entry.id, []]));

  for (const enEntry of enEntries) {
    const text = normalizeWhitespace(enEntry.text);
    if (!text) {
      continue;
    }

    const candidates = jpEntries
      .filter((jpEntry) => overlaps(jpEntry, enEntry))
      .map((jpEntry) => ({
        jpEntry,
        score: scoreAlignment(jpEntry, enEntry),
      }))
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      continue;
    }

    assignments.get(candidates[0].jpEntry.id).push(text);
  }

  return assignments;
}

function scoreAlignment(jpEntry, enEntry) {
  const overlapStart = Math.max(jpEntry.beginSeconds, enEntry.beginSeconds);
  const overlapEnd = Math.min(jpEntry.endSeconds, enEntry.endSeconds);
  const overlapDuration = Math.max(0, overlapEnd - overlapStart);
  const jpDuration = Math.max(0.001, jpEntry.endSeconds - jpEntry.beginSeconds);
  const enDuration = Math.max(0.001, enEntry.endSeconds - enEntry.beginSeconds);
  const overlapRatio = overlapDuration / Math.min(jpDuration, enDuration);
  const midpointDistance = Math.abs(
    ((jpEntry.beginSeconds + jpEntry.endSeconds) / 2) - ((enEntry.beginSeconds + enEntry.endSeconds) / 2),
  );
  const cuePenalty = isLikelyCueOnlyJapanese(segmentsToText(jpEntry.segments)) && !isLikelyCueOnlyEnglish(enEntry.text)
    ? 0.35
    : 0;
  const lyricPenalty = jpEntry.isLyricLike && !isLikelyCueOnlyEnglish(enEntry.text)
    ? 0.45
    : 0;

  return overlapRatio - (midpointDistance * 0.08) - cuePenalty - lyricPenalty;
}

function isLikelyCueOnlyJapanese(text) {
  return FULL_PAREN_LINE_RE.test(normalizeWhitespace(text));
}

function isLikelyCueOnlyEnglish(text) {
  const normalized = normalizeWhitespace(text);
  if (BRACKET_LINE_RE.test(normalized)) {
    return true;
  }
  return normalized.split('\n').every((line) => BRACKET_LINE_RE.test(line.trim()));
}

function isLikelyLyricRegion(region, style, text) {
  if (region === '縦右') {
    return true;
  }
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return false;
  }
  if (normalized === '♪' || normalized === '～♪') {
    return true;
  }
  return style === 's3' && !normalized.startsWith('（');
}

function applyOverride(entry, override) {
  if ('character' in override) {
    entry.character = override.character;
  }
  if ('english' in override) {
    entry.english = override.english;
  }
  if ('segments' in override) {
    entry.segments = override.segments;
  }
}

function splitEntries(entries, partCount) {
  if (entries.length === 0) {
    return [];
  }

  const splitPoints = [];
  let startIndex = 0;

  for (let partIndex = 1; partIndex < partCount; partIndex += 1) {
    const remainingParts = partCount - partIndex + 1;
    const target = startIndex + Math.round((entries.length - startIndex) / remainingParts);
    const splitIndex = findSplitIndex(entries, startIndex, target);
    splitPoints.push(splitIndex);
    startIndex = splitIndex;
  }

  const parts = [];
  let previous = 0;
  for (const splitPoint of splitPoints) {
    parts.push(entries.slice(previous, splitPoint));
    previous = splitPoint;
  }
  parts.push(entries.slice(previous));
  return parts.filter((part) => part.length > 0);
}

function findSplitIndex(entries, startIndex, target) {
  const minIndex = Math.max(startIndex + 1, target - 30);
  const maxIndex = Math.min(entries.length - 1, target + 30);

  let bestIndex = Math.min(entries.length - 1, Math.max(startIndex + 1, target));
  let bestGap = -1;

  for (let i = minIndex; i <= maxIndex; i += 1) {
    const previous = entries[i - 1];
    const current = entries[i];
    const gap = parseClock(current.time) - parseClock(previous.timeEnd);
    if (gap > bestGap) {
      bestGap = gap;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function overlaps(a, b) {
  return a.beginSeconds <= b.endSeconds + 0.15 && b.beginSeconds <= a.endSeconds + 0.15;
}

function parseClock(clock) {
  const [hms, millis = '0'] = clock.split('.');
  const [hours, minutes, seconds] = hms.split(':').map(Number);
  return (hours * 3600) + (minutes * 60) + seconds + (Number(millis) / 1000);
}

function normalizeWhitespace(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function pushStringSegment(segments, value) {
  if (!value) {
    return;
  }
  const normalized = value.replace(/\r/g, '');
  const previous = segments.at(-1);
  if (typeof previous === 'string') {
    segments[segments.length - 1] = previous + normalized;
  } else {
    segments.push(normalized);
  }
}

function compactSegments(segments) {
  const compacted = [];

  for (const segment of segments) {
    if (typeof segment === 'string') {
      if (!segment) {
        continue;
      }
      pushStringSegment(compacted, segment);
      continue;
    }
    if (!segment.kanji) {
      continue;
    }
    compacted.push(segment);
  }

  return compacted;
}

function segmentsToText(segments) {
  return segments.map((segment) => (typeof segment === 'string' ? segment : segment.kanji)).join('');
}

function countRubySegments(segments) {
  return segments.filter((segment) => typeof segment !== 'string').length;
}

function dedupeLines(lines) {
  const seen = new Set();
  const output = [];

  for (const line of lines) {
    if (!line || seen.has(line)) {
      continue;
    }
    seen.add(line);
    output.push(line);
  }

  return output;
}
