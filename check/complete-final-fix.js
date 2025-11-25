const fs = require('fs');
const path = require('path');

// Complete kanji readings dictionary
const kanjiReadings = {
  // All previous ones
  "物": "もの", "青": "あお", "反": "はん", "射": "しゃ", "後": "あと", "役": "やく",
  "聞": "き", "碇": "いかり", "綾": "あや", "波": "なみ", "葛": "かつら", "城": "ぎ",
  "作": "さ", "専": "せん", "用": "よう", "二": "に", "業": "ぎょう", "艦": "かん",
  "及": "およ", "式": "しき", "砲": "ほう", "雷": "らい", "航": "こう", "空": "くう",
  "機": "き", "左": "ひだり", "舷": "げん", "異": "い", "最": "もっと", "順": "じゅん",
  "調": "ちょう", "整": "せい", "長": "ちょう", "隔": "かく", "壁": "へき", "薄": "うす",
  "弱": "じゃく", "荷": "か", "電": "でん", "同": "おな", "事": "こと", "何": "なに",
  "度": "ど", "繰": "く", "返": "かえ", "自": "じ", "分": "ぶん", "感": "かん",
  "任": "まか", "君": "きみ", "化": "か", "間": "あいだ", "起": "お", "言": "い",
  "父": "とう", "信": "しん", "気": "き", "安": "やす", "魂": "たましい", "浄": "じょう",
  "願": "ねが", "疑": "ぎ", "似": "じ", "超": "こ", "始": "はじ", "儀": "ぎ",
  "手": "て", "間": "ま", "決": "けっ", "戦": "せん", "挑": "いど", "話": "はなし",
  "北": "きた", "上": "うえ", "主": "しゅ", "圧": "あつ", "武": "ぶ", "装": "そう",
  "爆": "ばく", "発": "はつ", "計": "けい", "常": "じょう", "着": "ちゃく",
  "必": "ひつ", "要": "よう", "果": "は", "殊": "しゅ", "環": "かん", "境": "きょう",
  "破": "は", "壊": "かい", "冷": "れい", "却": "きゃく",
  // FINAL batch - remaining kanji
  "鈴": "すず", "原": "はら", "兄": "あに", "演": "えん", "算": "さん", "総": "そう",
  "員": "いん", "点": "てん", "呼": "こ", "一": "いち", "耐": "たい", "母": "はは",
  "央": "おう", "部": "ぶ", "被": "ひ", "弾": "だん"
};

// Helper function
function isKanji(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x4E00 && code <= 0x9FAF) || (code >= 0x3400 && code <= 0x4DBF);
}

// Fix segments
function fixSegments(segments) {
  const fixed = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (typeof segment === 'string') {
      if (segment.length === 1 && isKanji(segment)) {
        const reading = kanjiReadings[segment];
        if (reading) {
          fixed.push({ kanji: segment, reading: reading });
        } else {
          fixed.push(segment);
        }
      } else {
        let temp = '';
        for (let j = 0; j < segment.length; j++) {
          const char = segment[j];
          if (isKanji(char) && kanjiReadings[char]) {
            if (temp) {
              fixed.push(temp);
              temp = '';
            }
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

// Main fix
function fixAllFiles() {
  const dataDir = path.join(__dirname, '..', 'eva-script-japanese', 'src', 'data');
  let totalFixed = 0;

  for (let partNum = 1; partNum <= 6; partNum++) {
    const filePath = path.join(dataDir, `Eva_3.33_Combined_Part${partNum}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    console.log(`Processing Part ${partNum}...`);

    let partKanjiFixed = 0;

    data.forEach((entry, index) => {
      // Fix kanji without readings
      const originalSegments = JSON.stringify(entry.segments);
      entry.segments = fixSegments(entry.segments);
      if (JSON.stringify(entry.segments) !== originalSegments) {
        partKanjiFixed++;
      }
    });

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`  Fixed Kanji: ${partKanjiFixed}`);
    totalFixed += partKanjiFixed;
  }

  console.log(`\n=== FIX COMPLETE ===`);
  console.log(`Total kanji readings added: ${totalFixed}`);
}

fixAllFiles();
