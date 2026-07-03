const fs = require('fs');
const path = require('path');

// Read candidate matches
const candidateMatches = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'candidate-matches.json'),
    'utf8'
  )
);

console.log(`Total candidate matches: ${candidateMatches.length}`);

// Split into single and multiple
const singleCandidates = [];
const multipleCandidates = [];

for (const match of candidateMatches) {
  if (match.englishes.length === 1) {
    singleCandidates.push(match);
  } else if (match.englishes.length > 1) {
    multipleCandidates.push(match);
  }
}

console.log(`Single candidate entries: ${singleCandidates.length}`);
console.log(`Multiple candidate entries: ${multipleCandidates.length}`);

// Save single candidates
fs.writeFileSync(
  path.join(__dirname, 'single-candidates.json'),
  JSON.stringify(singleCandidates, null, 2),
  'utf8'
);
console.log('\n✓ Saved single-candidates.json');

// Save multiple candidates
fs.writeFileSync(
  path.join(__dirname, 'multiple-candidates.json'),
  JSON.stringify(multipleCandidates, null, 2),
  'utf8'
);
console.log('✓ Saved multiple-candidates.json');

console.log('\n=== COMPLETE ===');
