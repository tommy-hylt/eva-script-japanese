const fs = require('fs');
const path = require('path');

// Read files
const japaneseContent = fs.readFileSync(
  path.join(__dirname, 'Evangelion_3.33_Script_Japanese.txt'),
  'utf8'
);

const englishContent = fs.readFileSync(
  path.join(__dirname, 'Evangelion_3.33_Script_English.txt'),
  'utf8'
);

const characterNameMap = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'character-name-map.json'),
    'utf8'
  )
);

// Regex to extract time, character, and text
const lineRegex = /^(\d{2}:\d{2}:[\d?]{2})\s+\{([^}]+)\}\s+(.+?)[\r\n]*$/;

// Parse script
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
        text: text.trim()
      });
    }
  }

  return result;
}

console.log('Parsing Japanese script...');
const japaneseArray = parseScript(japaneseContent);
console.log(`Found ${japaneseArray.length} Japanese entries`);

console.log('Parsing English script...');
const englishArray = parseScript(englishContent);
console.log(`Found ${englishArray.length} English entries`);

// Build English lookup by time and translated character
console.log('\nBuilding English lookup...');
const englishLookup = new Map();

for (const entry of englishArray) {
  const key = entry.time;
  if (!englishLookup.has(key)) {
    englishLookup.set(key, []);
  }
  englishLookup.get(key).push(entry);
}

// Generate combined array
console.log('Combining scripts...');
const combined = [];
let matchedCount = 0;

for (const japEntry of japaneseArray) {
  const row = {
    time: japEntry.time,
    character: japEntry.character,
    japanese: japEntry.text
  };

  // Try to match by time and character translation
  const englishCandidates = englishLookup.get(japEntry.time);

  if (englishCandidates && englishCandidates.length > 0) {
    // Get translated character name
    const translatedChar = characterNameMap[japEntry.character];

    // Find matching English entry
    let matchedEntry = null;

    if (translatedChar) {
      // Look for exact match with translated character
      matchedEntry = englishCandidates.find(e => e.character === translatedChar);
    }

    // If no exact match but there's only one candidate, use it
    if (!matchedEntry && englishCandidates.length === 1) {
      matchedEntry = englishCandidates[0];
    }

    if (matchedEntry) {
      row.english = matchedEntry.text;
      matchedCount++;
    }
  }

  combined.push(row);
}

console.log(`Matched ${matchedCount} out of ${combined.length} entries`);

// Save output
const outputPath = path.join(__dirname, 'combined-script.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(combined, null, 2),
  'utf8'
);

console.log(`\n✓ Saved combined-script.json`);
console.log(`Total entries: ${combined.length}`);
console.log(`Entries with English: ${matchedCount}`);
console.log(`Entries without English: ${combined.length - matchedCount}`);
