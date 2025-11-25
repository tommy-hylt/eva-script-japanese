const fs = require('fs');
const path = require('path');

console.log('Copying reordered files to eva-script-japanese/src/data...\n');

const sourceDir = __dirname;
const targetDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');

let copiedCount = 0;

for (let partNum = 1; partNum <= 6; partNum++) {
  const fileName = `Eva_3.33_Combined_Part${partNum}.json`;
  const sourcePath = path.join(sourceDir, fileName);
  const targetPath = path.join(targetDir, fileName);

  // Read source file
  const content = fs.readFileSync(sourcePath, 'utf8');

  // Write to target
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log(`✓ Copied ${fileName}`);
  copiedCount++;
}

console.log(`\n=== COMPLETE ===`);
console.log(`Successfully copied ${copiedCount} files to eva-script-japanese/src/data`);
