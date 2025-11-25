const fs = require('fs');
const path = require('path');

// Read the character translation map
const translationMap = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'character-translation-map.json'),
    'utf8'
  )
);

// Create simple map with just Japanese key -> English value
const simpleMap = {};

for (const [japaneseChar, data] of Object.entries(translationMap)) {
  simpleMap[japaneseChar] = data.english;
}

// Save simplified map
fs.writeFileSync(
  path.join(__dirname, 'character-name-map.json'),
  JSON.stringify(simpleMap, null, 2),
  'utf8'
);

console.log('✓ Created simplified character-name-map.json');
console.log(`\nTotal character mappings: ${Object.keys(simpleMap).length}`);
console.log('\nSimple Map:');
console.log(JSON.stringify(simpleMap, null, 2));
