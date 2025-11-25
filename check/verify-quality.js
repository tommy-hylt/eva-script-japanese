const fs = require('fs');
const path = require('path');

// Helper function to check if character is kanji
function isKanji(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x4E00 && code <= 0x9FAF) || // CJK Unified Ideographs
         (code >= 0x3400 && code <= 0x4DBF);   // CJK Extension A
}

// Check if a segment contains kanji without reading
function hasKanjiWithoutReading(segments) {
  const issues = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // If it's a string, check if it contains kanji
    if (typeof segment === 'string') {
      for (let j = 0; j < segment.length; j++) {
        if (isKanji(segment[j])) {
          issues.push({
            type: 'kanji_without_reading',
            segment: segment,
            kanji: segment[j],
            position: i
          });
        }
      }
    }
  }

  return issues;
}

// Main verification
function verifyFiles() {
  const dataDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');

  let totalEntries = 0;
  let entriesWithoutEnglish = [];
  let entriesWithKanjiIssues = [];

  for (let partNum = 1; partNum <= 6; partNum++) {
    const filePath = path.join(dataDir, `Eva_3.33_Combined_Part${partNum}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    console.log(`\nChecking Part ${partNum}: ${data.length} entries`);

    data.forEach((entry, index) => {
      totalEntries++;

      // Check for missing English
      if (!entry.english || entry.english.trim() === '') {
        entriesWithoutEnglish.push({
          part: partNum,
          index: index,
          time: entry.time,
          character: entry.character,
          japanese: entry.segments
        });
      }

      // Check for kanji without reading
      const kanjiIssues = hasKanjiWithoutReading(entry.segments);
      if (kanjiIssues.length > 0) {
        entriesWithKanjiIssues.push({
          part: partNum,
          index: index,
          time: entry.time,
          character: entry.character,
          issues: kanjiIssues
        });
      }
    });
  }

  // Report results
  console.log('\n\n=== VERIFICATION RESULTS ===\n');
  console.log(`Total entries checked: ${totalEntries}`);
  console.log(`Entries without English: ${entriesWithoutEnglish.length}`);
  console.log(`Entries with kanji issues: ${entriesWithKanjiIssues.length}`);

  // Show entries without English
  if (entriesWithoutEnglish.length > 0) {
    console.log('\n--- Entries WITHOUT English ---');
    entriesWithoutEnglish.slice(0, 20).forEach((entry, i) => {
      console.log(`${i + 1}. Part ${entry.part}, Time ${entry.time}, Character: ${entry.character}`);
    });
    if (entriesWithoutEnglish.length > 20) {
      console.log(`... and ${entriesWithoutEnglish.length - 20} more`);
    }
  }

  // Show entries with kanji issues
  if (entriesWithKanjiIssues.length > 0) {
    console.log('\n--- Entries with Kanji WITHOUT Reading ---');
    entriesWithKanjiIssues.slice(0, 20).forEach((entry, i) => {
      console.log(`${i + 1}. Part ${entry.part}, Time ${entry.time}, Character: ${entry.character}`);
      entry.issues.slice(0, 3).forEach(issue => {
        console.log(`   Kanji: "${issue.kanji}" in segment: "${issue.segment}"`);
      });
    });
    if (entriesWithKanjiIssues.length > 20) {
      console.log(`... and ${entriesWithKanjiIssues.length - 20} more`);
    }
  }

  // Save detailed reports
  if (entriesWithoutEnglish.length > 0) {
    const reportPath = path.join(__dirname, 'missing-english-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(entriesWithoutEnglish, null, 2));
    console.log(`\nDetailed report saved to: missing-english-report.json`);
  }

  if (entriesWithKanjiIssues.length > 0) {
    const reportPath = path.join(__dirname, 'kanji-issues-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(entriesWithKanjiIssues, null, 2));
    console.log(`Detailed report saved to: kanji-issues-report.json`);
  }
}

verifyFiles();
