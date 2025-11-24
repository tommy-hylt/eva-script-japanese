const fs = require('fs');
const path = require('path');

// Read all JSON files
function readAllFiles() {
  const dataDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');
  const missingFile = path.join(__dirname, 'missing-lines-with-furigana.json');

  let allEntries = [];

  // Read existing 6 parts
  console.log('Reading existing 6 JSON files...');
  for (let i = 1; i <= 6; i++) {
    const filePath = path.join(dataDir, `Eva_3.33_Combined_Part${i}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    console.log(`  Part ${i}: ${data.length} entries`);
    allEntries = allEntries.concat(data);
  }

  // Read missing lines
  console.log('Reading missing lines...');
  const missingContent = fs.readFileSync(missingFile, 'utf8');
  const missingData = JSON.parse(missingContent);
  console.log(`  Missing: ${missingData.length} entries`);
  allEntries = allEntries.concat(missingData);

  console.log(`\nTotal entries before sorting: ${allEntries.length}`);
  return allEntries;
}

// Sort entries by time
function sortByTime(entries) {
  console.log('\nSorting by time...');

  // Convert time string to comparable number
  function timeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  entries.sort((a, b) => {
    return timeToSeconds(a.time) - timeToSeconds(b.time);
  });

  console.log(`Sorted ${entries.length} entries`);
  return entries;
}

// Split into 6 parts
function splitIntoParts(entries) {
  console.log('\nSplitting into 6 parts...');

  const totalEntries = entries.length;
  const entriesPerPart = Math.ceil(totalEntries / 6);

  const parts = [];
  for (let i = 0; i < 6; i++) {
    const start = i * entriesPerPart;
    const end = Math.min(start + entriesPerPart, totalEntries);
    const part = entries.slice(start, end);
    parts.push(part);

    console.log(`  Part ${i + 1}: ${part.length} entries (${part[0].time} - ${part[part.length - 1].time})`);
  }

  return parts;
}

// Write output files
function writeOutputFiles(parts) {
  const outputDir = path.join(__dirname, 'output');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('\nCreated output directory');
  }

  console.log('\nWriting output files...');

  for (let i = 0; i < parts.length; i++) {
    const filename = `Eva_3.33_Combined_Part${i + 1}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(parts[i], null, 2), 'utf8');
    console.log(`  ✓ ${filename}: ${parts[i].length} entries`);
  }

  console.log(`\n✓ All files written to: ${outputDir}`);
}

// Main execution
function main() {
  try {
    console.log('=== Merging and Splitting JSON Files ===\n');

    const allEntries = readAllFiles();
    const sortedEntries = sortByTime(allEntries);
    const parts = splitIntoParts(sortedEntries);
    writeOutputFiles(parts);

    console.log('\n=== Complete! ===');
    console.log('\nYou can now verify the files in the "output" folder');
    console.log('and copy them to "eva-script-japanese/src/data" when ready.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
