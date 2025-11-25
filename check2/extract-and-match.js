const fs = require('fs');
const path = require('path');

// Read Japanese script
const japaneseContent = fs.readFileSync(
  path.join(__dirname, 'Evangelion_3.33_Script_Japanese.txt'),
  'utf8'
);

// Read English script
const englishContent = fs.readFileSync(
  path.join(__dirname, 'Evangelion_3.33_Script_English.txt'),
  'utf8'
);

// Regex to extract time, character, and text
// Pattern: HH:MM:SS {Character} Text
// Handle both \n and \r\n line endings
const lineRegex = /^(\d{2}:\d{2}:[\d?]{2})\s+\{([^}]+)\}\s+(.+?)[\r\n]*$/;

// Parse Japanese script
function parseScript(content) {
  // Split by both \n and \r\n
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

// Match by time
console.log('\nMatching by time...');
const matched = [];
const japaneseByTime = new Map();
const englishByTime = new Map();

// Build lookup maps
japaneseArray.forEach(entry => {
  japaneseByTime.set(entry.time, entry);
});

englishArray.forEach(entry => {
  englishByTime.set(entry.time, entry);
});

// Match entries
for (const [time, japEntry] of japaneseByTime) {
  const engEntry = englishByTime.get(time);
  if (engEntry) {
    matched.push({
      time,
      Japanese: {
        character: japEntry.character,
        text: japEntry.text
      },
      English: {
        character: engEntry.character,
        text: engEntry.text
      }
    });
  } else {
    // No English match
    matched.push({
      time,
      Japanese: {
        character: japEntry.character,
        text: japEntry.text
      },
      English: null
    });
  }
}

console.log(`Matched ${matched.length} entries`);

// Build character name translation map
console.log('\nBuilding character name translation map...');
const characterPairs = new Map();

for (const entry of matched) {
  if (entry.English) {
    const japChar = entry.Japanese.character;
    const engChar = entry.English.character;

    if (!characterPairs.has(japChar)) {
      characterPairs.set(japChar, new Map());
    }

    const counts = characterPairs.get(japChar);
    counts.set(engChar, (counts.get(engChar) || 0) + 1);
  }
}

// Extract most frequent pair for each Japanese character
const translationMap = {};

for (const [japChar, counts] of characterPairs) {
  let maxCount = 0;
  let mostFrequent = null;

  for (const [engChar, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = engChar;
    }
  }

  translationMap[japChar] = {
    english: mostFrequent,
    occurrences: maxCount,
    total: japaneseByTime.size // Total appearances of this Japanese character
  };
}

console.log(`\nFound ${Object.keys(translationMap).length} unique Japanese character names`);

// Save outputs
console.log('\nSaving outputs...');

// Save matched data
fs.writeFileSync(
  path.join(__dirname, 'matched-scripts.json'),
  JSON.stringify(matched, null, 2),
  'utf8'
);
console.log('✓ Saved matched-scripts.json');

// Save translation map
fs.writeFileSync(
  path.join(__dirname, 'character-translation-map.json'),
  JSON.stringify(translationMap, null, 2),
  'utf8'
);
console.log('✓ Saved character-translation-map.json');

// Print summary
console.log('\n=== CHARACTER TRANSLATION MAP ===');
const sortedChars = Object.keys(translationMap).sort();
for (const japChar of sortedChars) {
  const translation = translationMap[japChar];
  console.log(`${japChar.padEnd(20)} -> ${translation.english} (${translation.occurrences} times)`);
}

console.log('\n=== COMPLETE ===');
