const fs = require('fs');
const path = require('path');

// Read all 6 JSON files and extract time + character into a Set
function readJsonFiles() {
  const dataDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');
  const set = new Set();

  for (let i = 1; i <= 6; i++) {
    const filePath = path.join(dataDir, `Eva_3.33_Combined_Part${i}.json`);
    console.log(`Reading: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    data.forEach(entry => {
      if (entry.time && entry.character) {
        const key = `${entry.time} {${entry.character}}`;
        set.add(key);
      }
    });
  }

  console.log(`\nTotal entries in JSON files: ${set.size}\n`);
  return set;
}

// Read the Japanese script and find missing lines
function extractMissingLines(jsonSet) {
  const scriptPath = path.join(__dirname, '..', 'Evangelion_3.33_Script_Japanese.txt');
  console.log(`Reading script: ${scriptPath}\n`);

  const content = fs.readFileSync(scriptPath, 'utf8');
  const lines = content.split('\n');

  // Regex to match: HH:MM:SS {character} Japanese text
  // Note: Japanese script uses full-width spaces (　) and regular spaces
  // Don't use $ anchor due to \r\n line endings
  const regex = /^(\d{2}:\d{2}:\d{2})\s+\{([^}]+)\}\s*(.*)/;

  const missingLines = [];

  lines.forEach((line, index) => {
    const match = line.match(regex);
    if (match) {
      const time = match[1];
      const character = match[2];
      const japanese = match[3].trim();
      const key = `${time} {${character}}`;

      if (!jsonSet.has(key)) {
        missingLines.push({
          time: time,
          character: character,
          japanese: japanese
        });
      }
    }
  });

  return missingLines;
}

// Main execution
try {
  console.log('=== Extracting missing lines to JSON ===\n');

  const jsonSet = readJsonFiles();
  const missingLines = extractMissingLines(jsonSet);

  console.log('=== RESULTS ===\n');
  console.log(`Found ${missingLines.length} missing lines\n`);

  // Write to missing-lines.json
  const outputPath = path.join(__dirname, 'missing-lines.json');
  fs.writeFileSync(outputPath, JSON.stringify(missingLines, null, 2), 'utf8');

  console.log(`✓ Exported to: ${outputPath}`);
  console.log(`✓ Total missing entries: ${missingLines.length}`);

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
