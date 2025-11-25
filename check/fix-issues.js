const fs = require('fs');
const path = require('path');

// English script mapping
const englishScript = new Map();

function loadEnglishScript() {
  const scriptPath = path.join(__dirname, '..', 'Evangelion_3.33_Script.txt');
  const content = fs.readFileSync(scriptPath, 'utf8');
  const lines = content.split('\n');
  const regex = /^(\d{2}:\d{2}:\d{2})\s+\{([^}]+)\}\s+(.*)/;

  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      const time = match[1];
      const english = match[3].trim();
      englishScript.set(time, english);
    }
  });

  console.log(`Loaded ${englishScript.size} English entries`);
}

// Kanji to reading mappings (comprehensive)
const kanjiReadings = {
  "物": "もの",
  "青": "あお",
  "反": "はん",
  "射": "しゃ",
  "後": "あと",
  "役": "やく",
  "聞": "き",
  "碇": "いかり",
  "綾": "あや",
  "波": "なみ",
  "葛": "かつら",
  "城": "ぎ",
  "作": "さ",
  "専": "せん",
  "用": "よう",
  "二": "に",
  "業": "ぎょう",
  "艦": "かん",
  "残": "ざん",
  "段": "だん",
  "何": "なに",
  "私": "わたし",
  "毎": "まい",
  "日": "にち",
  "寝": "ね",
  "言": "い",
  "棺": "かん",
  "彼": "かれ",
  "女": "かのじょ",
  "槍": "やり",
  "先": "さき",
  "持": "も",
  "出": "だ",
  "行": "い",
  "今": "いま",
  "戻": "もど",
  "途": "と",
  "抜": "ぬ",
  "好": "す",
  "真": "ま",
  "似": "に",
  "結": "けっ",
  "局": "きょく",
  "諦": "あきら",
  "大": "おお",
  "嫌": "きら",
  "世": "せ",
  "界": "かい",
  "始": "はじ",
  "第": "だい",
  "次": "じ",
  "衝": "しょう",
  "夢": "ゆめ",
  "止": "と",
  "扉": "とびら",
  "閉": "し",
  "人": "ひと",
  "類": "るい",
  "終": "お",
  "平": "へい",
  "和": "わ",
  "声": "こえ",
  "君": "きみ",
  "近": "ちか",
  "劇": "げき",
  "場": "じょう",
  "版": "ばん"
};

// Helper to check if character is kanji
function isKanji(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x4E00 && code <= 0x9FAF) || (code >= 0x3400 && code <= 0x4DBF);
}

// Fix segments by adding furigana to standalone kanji
function fixSegments(segments) {
  const fixed = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (typeof segment === 'string') {
      // Check if it's a single kanji
      if (segment.length === 1 && isKanji(segment)) {
        const reading = kanjiReadings[segment];
        if (reading) {
          fixed.push({ kanji: segment, reading: reading });
        } else {
          // Keep as-is if no reading found
          fixed.push(segment);
        }
      } else {
        // Check if string contains multiple kanji that need splitting
        let temp = '';
        for (let j = 0; j < segment.length; j++) {
          const char = segment[j];
          if (isKanji(char) && kanjiReadings[char]) {
            // Push accumulated non-kanji first
            if (temp) {
              fixed.push(temp);
              temp = '';
            }
            // Push kanji with reading
            fixed.push({ kanji: char, reading: kanjiReadings[char] });
          } else {
            temp += char;
          }
        }
        if (temp) {
          fixed.push(temp);
        }
      }
    } else {
      fixed.push(segment);
    }
  }

  return fixed;
}

// Main fix function
function fixAllFiles() {
  loadEnglishScript();

  const dataDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');
  let totalFixed = 0;
  let englishFixed = 0;
  let kanjiFixed = 0;

  for (let partNum = 1; partNum <= 6; partNum++) {
    const filePath = path.join(dataDir, `Eva_3.33_Combined_Part${partNum}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    console.log(`\nProcessing Part ${partNum}...`);

    let partEnglishFixed = 0;
    let partKanjiFixed = 0;

    data.forEach((entry, index) => {
      let modified = false;

      // Fix missing English
      if (!entry.english || entry.english.trim() === '') {
        const english = englishScript.get(entry.time);
        if (english) {
          entry.english = english;
          partEnglishFixed++;
          modified = true;
        }
      }

      // Fix kanji without readings
      const originalSegments = JSON.stringify(entry.segments);
      entry.segments = fixSegments(entry.segments);
      if (JSON.stringify(entry.segments) !== originalSegments) {
        partKanjiFixed++;
        modified = true;
      }

      if (modified) totalFixed++;
    });

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`  Fixed English: ${partEnglishFixed}`);
    console.log(`  Fixed Kanji: ${partKanjiFixed}`);

    englishFixed += partEnglishFixed;
    kanjiFixed += partKanjiFixed;
  }

  console.log(`\n=== FIX COMPLETE ===`);
  console.log(`Total entries fixed: ${totalFixed}`);
  console.log(`English translations added: ${englishFixed}`);
  console.log(`Kanji readings added: ${kanjiFixed}`);
}

fixAllFiles();
