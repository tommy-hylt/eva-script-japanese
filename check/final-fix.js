const fs = require('fs');
const path = require('path');

// Expanded kanji readings
const kanjiReadings = {
  // Previous ones
  "物": "もの", "青": "あお", "反": "はん", "射": "しゃ", "後": "あと", "役": "やく",
  "聞": "き", "碇": "いかり", "綾": "あや", "波": "なみ", "葛": "かつら", "城": "ぎ",
  "作": "さ", "専": "せん", "用": "よう", "二": "に", "業": "ぎょう", "艦": "かん",
  // Additional kanji
  "及": "およ", "式": "しき", "砲": "ほう", "雷": "らい", "航": "こう", "空": "くう",
  "機": "き", "左": "ひだり", "舷": "げん", "異": "い", "最": "もっと", "順": "じゅん",
  "調": "ちょう", "整": "せい", "長": "ちょう", "隔": "かく", "壁": "へき", "薄": "うす",
  "弱": "じゃく", "荷": "か", "電": "でん", "同": "おな", "事": "こと", "何": "なに",
  "度": "ど", "繰": "く", "返": "かえ", "自": "じ", "分": "ぶん", "感": "かん",
  "任": "まか", "君": "きみ", "化": "か", "間": "あいだ", "起": "お", "言": "い",
  "父": "とう", "信": "しん", "気": "き", "安": "やす", "魂": "たましい", "浄": "じょう",
  "願": "ねが", "疑": "ぎ", "似": "じ", "超": "こ", "始": "はじ", "儀": "ぎ",
  "手": "て", "間": "ま", "最": "さい", "後": "ご", "決": "けっ", "戦": "せん",
  "挑": "いど", "話": "はなし"
};

// English translations for sound effects/exclamations
const soundEffectTranslations = {
  "00:03:27": "Anti A.T. Field",
  "00:03:31": "Argh, still in the way!",
  "00:03:37": "Four-eyes! How long are you gonna sing!? So annoying!",
  "00:04:09": "Huh!",
  "00:04:52": "3...",
  "00:05:43": "Tch! Useless!",
  "00:05:52": "!?",
  "00:06:15": "02-Dash! Mission takes priority!",
  "00:06:21": "I know that!",
  "00:06:38": "Ungh...",
  "00:10:39": "They're back again.",
  "00:10:40": "All targets confirmed Code 4C.",
  "00:10:40": "It's three-dimensional.",
  "00:10:42": "First, they intend to seal us in here.",
  "00:10:43": "Decoy 02, and 06 have been destroyed.",
  "00:12:41": "Alrighty then...",
  "00:12:46": "And...",
  "00:13:14": "Ugh!",
  "00:13:35": "And worst of all, we can't even locate the core block target.",
  "00:15:46": "All ships, first-grade battle stations.",
  "00:16:16": "Tch!",
  "00:17:08": "Entry start.",
  "00:17:10": "LCL charge status is normal.",
  "00:19:05": "Flywheel pressure plate lock released.",
  "00:19:46": "Unit-02 at ignition position.",
  "00:19:48": "Here it comes!",
  "00:20:04": "Rotation at 36,000! All green!",
  "00:23:02": "Protect Unit-01 at all costs.",
  "00:26:40": "Currently transferring command systems to combat bridge.",
  "00:27:26": "I've been holding it in the whole time.",
  "00:27:33": "Injecting power for main engine ignition system.",
  "00:29:26": "Had a stubborn and stupid face.",
  "00:31:25": "!?",
  "00:31:41": "Ah...kyaaah!!",
  "00:32:53": "Hmph.",
  "00:32:54": "All personnel, perform emergency repairs on damaged sections and resume outfitting work.",
  "00:33:03": "Hah...",
  "00:35:11": "Hm?",
  "00:45:23": "You do the same thing over and over again, until you feel like you're doing it right.",
  "00:45:30": "That's all there is.",
  "00:46:01": "It's okay. Leave it to me.",
  "00:47:56": "...!!",
  "00:49:29": "Uwah!",
  "00:50:17": "Haa...haa...",
  "00:50:31": "...!!",
  "00:50:43": "This is the result of the Third Impact that occurred while you were merged with Unit-01.",
  "00:52:05": "...!!",
  "00:56:24": "!!",
  "00:58:59": "Ugh...uuh...",
  "01:00:16": "Uaaah!!!",
  "01:01:36": "Even if you say that, I can't trust EVA, or father, or Misato-san,",
  "01:01:39": "I can't believe anything anymore!!",
  "01:05:10": "For support.",
  "01:06:05": "Yeah.",
  "01:07:33": "Hm? Is that an EVA?",
  "01:15:08": "Wooooooh!!",
  "01:15:24": "Getting concerned.",
  "01:17:31": "We pray for the purification of peaceful souls.",
  "01:18:07": "It's exceeding pseudo-evolution form!",
  "01:19:29": "That's the beginning ritual.",
  "01:21:03": "There.",
  "01:29:43": "Always causing trouble, you troublesome brat.",
  "01:35:23": "WILLE challenges them to a final battle.",
  "01:41:39": "Let's talk."
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
        const english = soundEffectTranslations[entry.time];
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
