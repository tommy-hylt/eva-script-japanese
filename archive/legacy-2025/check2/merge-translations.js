const fs = require('fs');
const path = require('path');

// Read files
const combinedScript = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'combined-script.json'),
    'utf8'
  )
);

const matchedTranslations = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'matched-translations-reviewed.json'),
    'utf8'
  )
);

console.log(`Total entries in combined script: ${combinedScript.length}`);
console.log(`Reviewed translations: ${matchedTranslations.length}`);

// Build lookup map from Japanese to English
const translationMap = new Map();
for (const item of matchedTranslations) {
  translationMap.set(item.japanese, item.english);
}

console.log('\nMerging translations...');

let addedCount = 0;
let alreadyHasEnglish = 0;

// Process each entry
for (const entry of combinedScript) {
  if (entry.english) {
    // Already has English, don't alter
    alreadyHasEnglish++;
  } else {
    // Missing English, try to find translation
    const translation = translationMap.get(entry.japanese);
    if (translation) {
      entry.english = translation;
      addedCount++;
    }
  }
}

console.log(`Entries already with English: ${alreadyHasEnglish}`);
console.log(`New English translations added: ${addedCount}`);
console.log(`Entries still without English: ${combinedScript.length - alreadyHasEnglish - addedCount}`);

// Save output
const outputPath = path.join(__dirname, 'combined-script-updated.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(combinedScript, null, 2),
  'utf8'
);

console.log(`\n✓ Saved combined-script-updated.json`);
console.log('\n=== COMPLETE ===');
