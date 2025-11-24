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
function checkMissingLines(jsonSet) {
  const scriptPath = path.join(__dirname, '..', 'Evangelion_3.33_Script_Japanese.txt');
  console.log(`Reading script: ${scriptPath}\n`);

  const content = fs.readFileSync(scriptPath, 'utf8');
  const lines = content.split('\n');

  // Regex to match: HH:MM:SS {character}
  const regex = /^(\d{2}:\d{2}:\d{2})\s+\{([^}]+)\}/;

  const missingLines = [];

  lines.forEach((line, index) => {
    const match = line.match(regex);
    if (match) {
      const time = match[1];
      const character = match[2];
      const key = `${time} {${character}}`;

      if (!jsonSet.has(key)) {
        missingLines.push({
          lineNumber: index + 1,
          key: key,
          fullLine: line
        });
      }
    }
  });

  return missingLines;
}

// Main execution
try {
  console.log('=== Checking for missing lines ===\n');

  const jsonSet = readJsonFiles();
  const missingLines = checkMissingLines(jsonSet);

  console.log('=== RESULTS ===\n');

  if (missingLines.length === 0) {
    console.log('✓ No missing lines found! All script lines are present in JSON files.');
  } else {
    console.log(`✗ Found ${missingLines.length} missing lines:\n`);
    missingLines.forEach((item, index) => {
      console.log(`${index + 1}. Line ${item.lineNumber}: ${item.key}`);
      console.log(`   ${item.fullLine}`);
      console.log('');
    });
  }

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
