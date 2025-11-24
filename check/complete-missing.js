const fs = require('fs');
const path = require('path');

// Read English script
function readEnglishScript() {
  const scriptPath = path.join(__dirname, '..', 'Evangelion_3.33_Script.txt');
  const content = fs.readFileSync(scriptPath, 'utf8');
  const lines = content.split('\n');
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

  return timeToEnglish;
}

// Process missing lines
function processAndWrite(){
  const missingPath = path.join(__dirname, 'missing-lines.json');
  const missingLines = JSON.parse(fs.readFileSync(missingPath, 'utf8'));
  const timeToEnglish = readEnglishScript();

  console.log(`Processing ${missingLines.length} missing entries...`);

  const completed = missingLines.map(entry => {
    return {
      time: entry.time,
      character: entry.character,
      segments: [entry.japanese], // Simple segments - just the full Japanese text
      english: timeToEnglish.get(entry.time) || ""
    };
  });

  // Write output
  const outputPath = path.join(__dirname, 'completed-missing-lines.json');
  fs.writeFileSync(outputPath, JSON.stringify(completed, null, 2), 'utf8');

  console.log(`\n✓ Completed ${completed.length} entries`);
  console.log(`✓ Saved to: ${outputPath}`);

  // Count how many have English
  const withEnglish = completed.filter(e => e.english).length;
  const withoutEnglish = completed.length - withEnglish;
  console.log(`\nWith English: ${withEnglish}`);
  console.log(`Without English: ${withoutEnglish}`);
}

processAndWrite();
