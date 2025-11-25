const fs = require('fs');
const path = require('path');

// Read combined script with updates
const combinedScriptUpdated = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'combined-script-updated.json'),
    'utf8'
  )
);

console.log(`Total entries in combined script: ${combinedScriptUpdated.length}`);

// Build lookup map by time + character
const lookupMap = new Map();
for (const entry of combinedScriptUpdated) {
  const key = `${entry.time}|${entry.character}`;
  lookupMap.set(key, entry.english);
}

console.log(`Built lookup map with ${lookupMap.size} entries\n`);

// Process each of the 6 JSON files
const dataDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');
let totalReplaced = 0;
let totalProcessed = 0;

for (let partNum = 1; partNum <= 6; partNum++) {
  const filePath = path.join(dataDir, `Eva_3.33_Combined_Part${partNum}.json`);

  console.log(`Processing Part ${partNum}...`);

  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  let replacedInPart = 0;

  for (const entry of data) {
    totalProcessed++;
    const key = `${entry.time}|${entry.character}`;
    const newEnglish = lookupMap.get(key);

    if (newEnglish !== undefined) {
      // Check if it's different from current value
      if (entry.english !== newEnglish) {
        entry.english = newEnglish;
        replacedInPart++;
        totalReplaced++;
      }
    }
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

  console.log(`  Entries: ${data.length}`);
  console.log(`  Replaced: ${replacedInPart}`);
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total entries processed: ${totalProcessed}`);
console.log(`Total English fields replaced: ${totalReplaced}`);
console.log(`\n✓ All files updated successfully`);
