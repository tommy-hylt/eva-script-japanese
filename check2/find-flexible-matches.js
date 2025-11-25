const fs = require('fs');
const path = require('path');

// Read files
const combinedScript = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'combined-script.json'),
    'utf8'
  )
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

// Parse English script
const lineRegex = /^(\d{2}:\d{2}:[\d?]{2})\s+\{([^}]+)\}\s+(.+?)[\r\n]*$/;

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

console.log('Parsing English script...');
const englishArray = parseScript(englishContent);
console.log(`Found ${englishArray.length} English entries`);

// Convert time string to seconds
function timeToSeconds(timeStr) {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseInt(parts[2].replace('?', '0')); // Handle ?? as 00
  return hours * 3600 + minutes * 60 + seconds;
}

// Convert seconds back to time string
function secondsToTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Find entries without English
console.log('\nFinding entries without English...');
const withoutEnglish = combinedScript.filter(entry => !entry.english);
console.log(`Found ${withoutEnglish.length} entries without English`);

// Search with flexible time range
console.log('\nSearching with flexible time range (±1 second)...');
const flexibleMatches = [];

for (const japEntry of withoutEnglish) {
  const japTime = timeToSeconds(japEntry.time);
  const translatedChar = characterNameMap[japEntry.character];

  // Search in range [time-1, time+1]
  const candidates = [];

  for (const engEntry of englishArray) {
    const engTime = timeToSeconds(engEntry.time);
    const timeDiff = Math.abs(engTime - japTime);

    // Within ±1 second
    if (timeDiff <= 1) {
      // Check if character matches (if we have translation)
      if (translatedChar && engEntry.character === translatedChar) {
        candidates.push({
          engEntry,
          timeDiff,
          characterMatch: true
        });
      } else if (!translatedChar) {
        // No translation available, consider it
        candidates.push({
          engEntry,
          timeDiff,
          characterMatch: false
        });
      }
    }
  }

  // If there's exactly one perfect match (character matches or only one candidate), use it
  let perfectMatch = null;

  // First, look for character matches
  const characterMatches = candidates.filter(c => c.characterMatch);
  if (characterMatches.length === 1) {
    perfectMatch = characterMatches[0];
  } else if (candidates.length === 1) {
    // Only one candidate, use it
    perfectMatch = candidates[0];
  }

  if (perfectMatch) {
    flexibleMatches.push({
      time: japEntry.time,
      character: japEntry.character,
      japanese: japEntry.text,
      matched_english_time: perfectMatch.engEntry.time,
      matched_english_character: perfectMatch.engEntry.character,
      english: perfectMatch.engEntry.text,
      time_diff_seconds: perfectMatch.timeDiff,
      character_match: perfectMatch.characterMatch,
      translated_character: translatedChar || null
    });
  }
}

console.log(`Found ${flexibleMatches.length} flexible matches`);

// Save output
const outputPath = path.join(__dirname, 'flexible-matches.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(flexibleMatches, null, 2),
  'utf8'
);

console.log(`\n✓ Saved flexible-matches.json`);
console.log(`Total flexible matches: ${flexibleMatches.length}`);
console.log(`Remaining unmatched: ${withoutEnglish.length - flexibleMatches.length}`);

// Show summary
console.log('\n=== SUMMARY ===');
console.log(`Original entries without English: ${withoutEnglish.length}`);
console.log(`Found with flexible time matching: ${flexibleMatches.length}`);
console.log(`Still unmatched: ${withoutEnglish.length - flexibleMatches.length}`);
