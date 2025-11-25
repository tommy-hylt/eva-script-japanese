const fs = require('fs');
const path = require('path');

console.log('Removing "#Not in UTW#" tags from English fields...\n');

const dataDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');
let totalCleaned = 0;
let totalProcessed = 0;

for (let partNum = 1; partNum <= 6; partNum++) {
  const filePath = path.join(dataDir, `Eva_3.33_Combined_Part${partNum}.json`);

  console.log(`Processing Part ${partNum}...`);

  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  let cleanedInPart = 0;

  for (const entry of data) {
    totalProcessed++;

    if (entry.english && typeof entry.english === 'string') {
      const original = entry.english;
      // Remove "#Not in UTW#" and any surrounding whitespace
      const cleaned = entry.english.replace(/\s*#Not in UTW#\s*/g, '').trim();

      if (cleaned !== original) {
        entry.english = cleaned;
        cleanedInPart++;
        totalCleaned++;
      }
    }
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

  console.log(`  Entries: ${data.length}`);
  console.log(`  Cleaned: ${cleanedInPart}`);
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total entries processed: ${totalProcessed}`);
console.log(`Total entries cleaned: ${totalCleaned}`);
console.log(`\n✓ All "#Not in UTW#" tags removed successfully`);
