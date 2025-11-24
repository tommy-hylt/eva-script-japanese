const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'Evangelion_3.33_Script_Japanese.txt');
const content = fs.readFileSync(scriptPath, 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}\n`);

// Show first 15 lines with their raw content
console.log('First 15 lines:');
for (let i = 0; i < 15 && i < lines.length; i++) {
  const line = lines[i];
  console.log(`Line ${i + 1} (length ${line.length}): "${line}"`);

  // Show char codes for line 6 (first data line)
  if (i === 5) {
    console.log('  Char codes:', line.split('').map((c, idx) => `[${idx}]${c}:${c.charCodeAt(0)}`).join(' '));
  }
}

// Try different regex patterns
const patterns = [
  /^(\d{2}:\d{2}:\d{2})\s+\{([^}]+)\}\s*(.*)$/,
  /^(\d{2}:\d{2}:\d{2})\s*\{([^}]+)\}\s*(.*)$/,
  /(\d{2}:\d{2}:\d{2})\s*\{([^}]+)\}/,
];

console.log('\n\nTesting regex patterns on line 6:');
const testLine = lines[5];
patterns.forEach((pattern, idx) => {
  const match = testLine.match(pattern);
  console.log(`Pattern ${idx + 1}: ${match ? 'MATCH' : 'NO MATCH'}`);
  if (match) {
    console.log(`  Groups: time="${match[1]}", character="${match[2]}"`);
  }
});
