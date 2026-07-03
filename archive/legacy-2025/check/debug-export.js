const fs = require('fs');
const path = require('path');

// Read all 6 JSON files and extract time + character into a Set
function readJsonFiles() {
  const dataDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');
  const set = new Set();

  for (let i = 1; i <= 6; i++) {
    const filePath = path.join(dataDir, `Eva_3.33_Combined_Part${i}.json`);

    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    data.forEach(entry => {
      if (entry.time && entry.character) {
        const key = `${entry.time} {${entry.character}}`;
        set.add(key);
      }
    });
  }

  return set;
}

// Main execution
try {
  const scriptPath = path.join(__dirname, '..', 'Evangelion_3.33_Script_Japanese.txt');
  const content = fs.readFileSync(scriptPath, 'utf8');
  const lines = content.split('\n');

  // Regex to match: HH:MM:SS {character} Japanese text
  const regex = /^(\d{2}:\d{2}:\d{2})\s+\{([^}]+)\}\s*(.*)$/;

  const jsonSet = readJsonFiles();

  console.log('Sample keys from JSON Set:');
  const sampleKeys = Array.from(jsonSet).slice(0, 5);
  sampleKeys.forEach(key => console.log(`  "${key}"`));

  console.log('\nFirst 10 matching lines from script:');
  let count = 0;
  lines.forEach((line, index) => {
    const match = line.match(regex);
    if (match && count < 10) {
      const time = match[1];
      const character = match[2];
      const japanese = match[3].trim();
      const key = `${time} {${character}}`;
      const exists = jsonSet.has(key);

      console.log(`Line ${index + 1}: "${key}" - ${exists ? 'EXISTS' : 'MISSING'}`);
      if (!exists && count < 5) {
        console.log(`  Japanese: ${japanese}`);
      }
      count++;
    }
  });

  // Count total matches
  let totalMatches = 0;
  let totalMissing = 0;
  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      totalMatches++;
      const time = match[1];
      const character = match[2];
      const key = `${time} {${character}}`;
      if (!jsonSet.has(key)) {
        totalMissing++;
      }
    }
  });

  console.log(`\nTotal lines matching regex: ${totalMatches}`);
  console.log(`Total in JSON set: ${jsonSet.size}`);
  console.log(`Total missing: ${totalMissing}`);

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
