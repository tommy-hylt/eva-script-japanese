const fs = require('fs');
const path = require('path');

// Read English script and create a time-to-english map
function readEnglishScript() {
  const scriptPath = path.join(__dirname, '..', 'Evangelion_3.33_Script.txt');
  const content = fs.readFileSync(scriptPath, 'utf8');
  const lines = content.split('\n');

  // Regex to match: HH:MM:SS {character} English text
  const regex = /^(\d{2}:\d{2}:\d{2})\s+\{([^}]+)\}\s+(.*)/;

  const timeToEnglish = new Map();

  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      const time = match[1];
      const english = match[3].trim();
      timeToEnglish.set(time, english);
    }
  });

  console.log(`Loaded ${timeToEnglish.size} English entries`);
  return timeToEnglish;
}

// Convert Japanese text to segments format
// For now, we'll create simple segments without ruby annotations
// Proper conversion would require kuroshiro or similar NLP library
function convertToSegments(japanese) {
  // Simple approach: just wrap the entire text as a single segment
  // TODO: Use proper NLP library for kanji detection and furigana generation
  return [japanese];
}

// Fill missing lines with English and segments
function fillMissingLines() {
  const missingPath = path.join(__dirname, 'missing-lines.json');
  const missingLines = JSON.parse(fs.readFileSync(missingPath, 'utf8'));

  const timeToEnglish = readEnglishScript();

  console.log(`Processing ${missingLines.length} missing lines...\n`);

  let matchedCount = 0;
  let unmatchedCount = 0;

  const filledLines = missingLines.map((entry, index) => {
    const english = timeToEnglish.get(entry.time);

    if (english) {
      matchedCount++;
    } else {
      unmatchedCount++;
      if (unmatchedCount <= 5) {
        console.log(`Warning: No English match for ${entry.time} {${entry.character}}`);
      }
    }

    return {
      time: entry.time,
      character: entry.character,
      segments: convertToSegments(entry.japanese),
      english: english || ""
    };
  });

  console.log(`\nMatched: ${matchedCount}`);
  console.log(`Unmatched: ${unmatchedCount}`);

  return filledLines;
}

// Main execution
try {
  console.log('=== Filling missing lines with English and segments ===\n');

  const filledLines = fillMissingLines();

  // Write to filled-missing-lines.json
  const outputPath = path.join(__dirname, 'filled-missing-lines.json');
  fs.writeFileSync(outputPath, JSON.stringify(filledLines, null, 2), 'utf8');

  console.log(`\n✓ Exported to: ${outputPath}`);
  console.log(`✓ Total entries: ${filledLines.length}`);

  // Show a sample
  console.log('\nSample entry:');
  console.log(JSON.stringify(filledLines[0], null, 2));

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
