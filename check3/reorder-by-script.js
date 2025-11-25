const fs = require('fs');
const path = require('path');

// Read Japanese script
const japaneseContent = fs.readFileSync(
  path.join(__dirname, 'Evangelion_3.33_Script_Japanese.txt'),
  'utf8'
);

console.log('Reading Japanese script...');

// Regex to extract time, character, and text
// Handle both regular digits and ?? for seconds
const lineRegex = /^(\d{2}:\d{2}:(?:\d{2}|\?\?))\s+\{([^}]+)\}\s+(.+?)[\r\n]*$/;

// Parse Japanese script to get natural order
function parseScript(content) {
  const lines = content.split(/\r?\n/);
  const result = [];

  for (const line of lines) {
    const match = line.match(lineRegex);
    if (match) {
      const [, time, character, text] = match;
      result.push({
        time: time.trim(),
        character: character.trim(),
        japanese: text.trim()
      });
    }
  }

  return result;
}

const orderedScript = parseScript(japaneseContent);
console.log(`Found ${orderedScript.length} entries in natural order\n`);

// Read all 6 JSON files and build a map
console.log('Reading JSON files from eva-script-japanese/src/data...');
const dataDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');
const allEntries = [];

for (let partNum = 1; partNum <= 6; partNum++) {
  const filePath = path.join(dataDir, `Eva_3.33_Combined_Part${partNum}.json`);
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  allEntries.push(...data);
  console.log(`  Part ${partNum}: ${data.length} entries`);
}

console.log(`Total entries: ${allEntries.length}\n`);

// Function to reconstruct Japanese text from segments
function reconstructJapanese(segments) {
  if (!segments || !Array.isArray(segments)) return '';

  let result = '';
  for (const segment of segments) {
    if (typeof segment === 'string') {
      result += segment;
    } else if (segment && typeof segment === 'object' && segment.kanji) {
      result += segment.kanji;
    }
  }
  return result;
}

// Build map with multiple possible keys
console.log('Building lookup map...');
const entryMap = new Map();

for (const entry of allEntries) {
  const reconstructedJapanese = reconstructJapanese(entry.segments);

  // Create multiple keys for better matching
  const key1 = `${entry.time}|${entry.character}|${reconstructedJapanese}`;
  const key2 = `${entry.time}|${entry.character}`;
  const key3 = `${reconstructedJapanese}`;

  entryMap.set(key1, entry);
  if (!entryMap.has(key2)) {
    entryMap.set(key2, entry);
  }
  if (!entryMap.has(key3)) {
    entryMap.set(key3, entry);
  }
}

console.log(`Built map with ${entryMap.size} lookup keys\n`);

// Reorder based on natural order
console.log('Reordering entries...');
const reorderedEntries = [];
let matchedCount = 0;
let notFoundCount = 0;

for (const scriptEntry of orderedScript) {
  // Try to find match with progressively looser keys
  const key1 = `${scriptEntry.time}|${scriptEntry.character}|${scriptEntry.japanese}`;
  const key2 = `${scriptEntry.time}|${scriptEntry.character}`;
  const key3 = `${scriptEntry.japanese}`;

  let entry = entryMap.get(key1);

  if (!entry) {
    entry = entryMap.get(key2);
  }

  if (!entry) {
    entry = entryMap.get(key3);
  }

  // If still not found and time contains ??, try fuzzy time matching
  if (!entry && scriptEntry.time.includes('??')) {
    const timePrefix = scriptEntry.time.substring(0, 6); // Get "HH:MM:" part
    // Search through all entries for matching character and time prefix
    for (const [key, value] of entryMap.entries()) {
      if (key.includes(scriptEntry.character) && key.startsWith(timePrefix)) {
        const reconstructedJapanese = reconstructJapanese(value.segments);
        if (reconstructedJapanese === scriptEntry.japanese) {
          entry = value;
          break;
        }
      }
    }
  }

  if (entry) {
    reorderedEntries.push(entry);
    matchedCount++;
  } else {
    notFoundCount++;
    console.log(`  Not found: ${scriptEntry.time} ${scriptEntry.character} - ${scriptEntry.japanese.substring(0, 30)}...`);
  }
}

console.log(`\nMatched: ${matchedCount}`);
console.log(`Not found: ${notFoundCount}`);

// Save combined reordered file
const combinedOutputPath = path.join(__dirname, 'reordered-combined.json');
fs.writeFileSync(
  combinedOutputPath,
  JSON.stringify(reorderedEntries, null, 2),
  'utf8'
);
console.log(`\n✓ Saved reordered-combined.json (${reorderedEntries.length} entries)`);

// Split into 6 parts
console.log('\nSplitting into 6 parts...');
const entriesPerPart = Math.ceil(reorderedEntries.length / 6);

for (let partNum = 1; partNum <= 6; partNum++) {
  const start = (partNum - 1) * entriesPerPart;
  const end = partNum === 6 ? reorderedEntries.length : start + entriesPerPart;
  const partEntries = reorderedEntries.slice(start, end);

  const partPath = path.join(__dirname, `Eva_3.33_Combined_Part${partNum}.json`);
  fs.writeFileSync(
    partPath,
    JSON.stringify(partEntries, null, 2),
    'utf8'
  );

  console.log(`  Part ${partNum}: ${partEntries.length} entries saved`);
}

console.log('\n=== COMPLETE ===');
console.log('Files are ready in check3 folder for verification.');
console.log('If they look good, run the copy script to move them to eva-script-japanese/src/data');
