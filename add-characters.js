const fs = require('fs');
const path = require('path');

// Read the original Japanese script
const scriptPath = 'Evangelion_3.33_Script_Japanese.txt';
const scriptContent = fs.readFileSync(scriptPath, 'utf-8');

// Parse the script to extract character mapping
const characterMap = new Map();

const lines = scriptContent.split(/\r?\n/);  // Handle both Unix and Windows line endings
let matchCount = 0;

lines.forEach((line, index) => {
  // Match pattern: 00:11:00 {青葉(無線)} 　追跡班、両機の現在位置を報告。
  const match = line.match(/^(\d{2}:\d{2}:\d{2})\s*\{([^}]+)\}\s*(.+)$/);
  if (match) {
    const time = match[1];
    const character = match[2];
    // Remove all types of whitespace (including Japanese space 　) from the start of text
    const text = match[3].replace(/^[\s　]+/, '').trim();

    // Use time + normalized text as key for more accurate matching
    const key = `${time}|||${text}`;
    characterMap.set(key, character);
    matchCount++;

    if (matchCount <= 5) {
      console.log(`Sample ${matchCount}: time=${time}, char=${character}, text=${text.substring(0, 20)}...`);
    }
  }
});

console.log(`Loaded ${characterMap.size} character mappings from script`);

// Function to update a JSON file
function updateJSONFile(filePath) {
  console.log(`\nProcessing ${filePath}...`);

  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let updatedCount = 0;
  let notFoundCount = 0;

  jsonData.forEach((entry, index) => {
    const key = `${entry.time}|||${entry.japanese}`;
    const character = characterMap.get(key);

    if (character) {
      entry.character = character;
      updatedCount++;
    } else {
      if (notFoundCount < 3) {
        console.log(`  Warning: No character found for ${entry.time}: ${entry.japanese.substring(0, 30)}...`);
        console.log(`    Looking for key: ${key.substring(0, 60)}...`);
      }
      entry.character = "";
      notFoundCount++;
    }
  });

  // Write back with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');

  console.log(`  ✓ Updated ${updatedCount} entries`);
  if (notFoundCount > 0) {
    console.log(`  ! ${notFoundCount} entries without character`);
  }

  return { updatedCount, notFoundCount };
}

// Update all JSON files
const jsonDir = 'eva-script-japanese/src/data';
const stats = { total: 0, updated: 0, notFound: 0 };

for (let i = 1; i <= 6; i++) {
  const filePath = path.join(jsonDir, `Eva_3.33_Combined_Part${i}.json`);

  if (fs.existsSync(filePath)) {
    const result = updateJSONFile(filePath);
    stats.updated += result.updatedCount;
    stats.notFound += result.notFoundCount;
    stats.total++;
  } else {
    console.log(`File not found: ${filePath}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Files processed: ${stats.total}`);
console.log(`Total entries updated: ${stats.updated}`);
console.log(`Total entries without character: ${stats.notFound}`);
console.log(`Done!`);
