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

// Find entries without English
console.log('\nFinding entries without English...');
const withoutEnglish = combinedScript.filter(entry => !entry.english);
console.log(`Found ${withoutEnglish.length} entries without English`);

// Search with flexible time range ±2 seconds
console.log('\nSearching with flexible time range (±2 seconds)...');
const candidateMatches = [];
let totalCandidates = 0;

for (const japEntry of withoutEnglish) {
  const japTime = timeToSeconds(japEntry.time);
  const translatedChar = characterNameMap[japEntry.character];

  // Search in range [time-2, time+2]
  const englishes = [];

  for (const engEntry of englishArray) {
    const engTime = timeToSeconds(engEntry.time);
    const timeDiff = engTime - japTime; // Keep sign for direction

    // Within ±2 seconds
    if (Math.abs(timeDiff) <= 2) {
      englishes.push({
        time: engEntry.time,
        character: engEntry.character,
        text: engEntry.text,
        time_diff: timeDiff,
        character_match: translatedChar === engEntry.character
      });
    }
  }

  // Sort by time difference (closest first), then by character match
  englishes.sort((a, b) => {
    const absDiffA = Math.abs(a.time_diff);
    const absDiffB = Math.abs(b.time_diff);
    if (absDiffA !== absDiffB) {
      return absDiffA - absDiffB;
    }
    // If same time diff, prioritize character matches
    if (a.character_match && !b.character_match) return -1;
    if (!a.character_match && b.character_match) return 1;
    return 0;
  });

  totalCandidates += englishes.length;

  const englishTexts = englishes.map(e => e.text);

  // Only add if there are English candidates
  if (englishTexts.length > 0) {
    candidateMatches.push({
      japanese: japEntry.japanese,
      englishes: englishTexts
    });
  }
}

console.log(`Found ${totalCandidates} total candidates for ${withoutEnglish.length} entries`);
console.log(`Average: ${(totalCandidates / withoutEnglish.length).toFixed(1)} candidates per entry`);

// Save output
const outputPath = path.join(__dirname, 'candidate-matches.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(candidateMatches, null, 2),
  'utf8'
);

console.log(`\n✓ Saved candidate-matches.json`);

// Show statistics
const withCandidates = candidateMatches.filter(m => m.englishes.length > 0).length;
const withSingleCandidate = candidateMatches.filter(m => m.englishes.length === 1).length;
const withMultipleCandidates = candidateMatches.filter(m => m.englishes.length > 1).length;
const withNoCandidates = candidateMatches.filter(m => m.englishes.length === 0).length;

console.log('\n=== STATISTICS ===');
console.log(`Total entries without English: ${withoutEnglish.length}`);
console.log(`Entries with at least 1 candidate: ${withCandidates}`);
console.log(`  - Single candidate (auto-match): ${withSingleCandidate}`);
console.log(`  - Multiple candidates (need review): ${withMultipleCandidates}`);
console.log(`Entries with no candidates: ${withNoCandidates}`);
