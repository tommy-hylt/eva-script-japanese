const fs = require('fs');
const path = require('path');

// File paths
const JAPANESE_FILE = 'Evangelion_3.33_Script_Japanese.txt';
const ENGLISH_FILE = 'Evangelion_3.33_Script.txt';
const OUTPUT_PREFIX = 'Eva_3.33_Combined';

// Katakana to Hiragana conversion
const katakanaToHiragana = (text) => {
    const mapping = {
        'ア': 'あ', 'イ': 'い', 'ウ': 'う', 'エ': 'え', 'オ': 'お',
        'カ': 'か', 'キ': 'き', 'ク': 'く', 'ケ': 'け', 'コ': 'こ',
        'サ': 'さ', 'シ': 'し', 'ス': 'す', 'セ': 'せ', 'ソ': 'そ',
        'タ': 'た', 'チ': 'ち', 'ツ': 'つ', 'テ': 'て', 'ト': 'と',
        'ナ': 'な', 'ニ': 'に', 'ヌ': 'ぬ', 'ネ': 'ね', 'ノ': 'の',
        'ハ': 'は', 'ヒ': 'ひ', 'フ': 'ふ', 'ヘ': 'へ', 'ホ': 'ほ',
        'マ': 'ま', 'ミ': 'み', 'ム': 'む', 'メ': 'め', 'モ': 'も',
        'ヤ': 'や', 'ユ': 'ゆ', 'ヨ': 'よ',
        'ラ': 'ら', 'リ': 'り', 'ル': 'る', 'レ': 'れ', 'ロ': 'ろ',
        'ワ': 'わ', 'ヰ': 'ゐ', 'ヱ': 'ゑ', 'ヲ': 'を', 'ン': 'ん',
        'ガ': 'が', 'ギ': 'ぎ', 'グ': 'ぐ', 'ゲ': 'げ', 'ゴ': 'ご',
        'ザ': 'ざ', 'ジ': 'じ', 'ズ': 'ず', 'ゼ': 'ぜ', 'ゾ': 'ぞ',
        'ダ': 'だ', 'ヂ': 'ぢ', 'ヅ': 'づ', 'デ': 'で', 'ド': 'ど',
        'バ': 'ば', 'ビ': 'び', 'ブ': 'ぶ', 'ベ': 'べ', 'ボ': 'ぼ',
        'パ': 'ぱ', 'ピ': 'ぴ', 'プ': 'ぷ', 'ペ': 'ぺ', 'ポ': 'ぽ',
        'ァ': 'ぁ', 'ィ': 'ぃ', 'ゥ': 'ぅ', 'ェ': 'ぇ', 'ォ': 'ぉ',
        'ャ': 'ゃ', 'ュ': 'ゅ', 'ョ': 'ょ', 'ッ': 'っ', 'ヴ': 'ゔ'
    };

    return text.split('').map(char => mapping[char] || char).join('');
};

// Simple conversion to hiragana (basic katakana conversion only)
const convertToHiragana = (text) => {
    return katakanaToHiragana(text);
};

// Parse script line
const parseScriptLine = (line) => {
    // Pattern: HH:MM:SS {speaker} text (without line number prefix)
    // Clean line first (remove \r and various whitespace)
    const cleanLine = line.replace(/\r/g, '').trim();
    if (!cleanLine) return null;

    const pattern = /^(\d{2}:\d{2}:\d{2})\s*\{([^}]+)\}[\s\u3000]+(.+)$/;
    const match = cleanLine.match(pattern);

    if (match) {
        return {
            timestamp: match[1],
            speaker: match[2].trim(),
            text: match[3].trim()
        };
    }

    return null;
};

// Load script file
const loadScript = (filepath, startLine = 1) => {
    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n');
    const scriptDict = {};

    lines.forEach((line, index) => {
        if (index + 1 < startLine) return;

        const parsed = parseScriptLine(line);
        if (parsed) {
            scriptDict[parsed.timestamp] = {
                speaker: parsed.speaker,
                text: parsed.text
            };
        }
    });

    return scriptDict;
};

// Create combined entries
const createCombinedEntries = (japaneseScript, englishScript) => {
    const combined = [];

    // Get all timestamps and sort them
    const allTimestamps = [...new Set([
        ...Object.keys(japaneseScript),
        ...Object.keys(englishScript)
    ])].sort();

    allTimestamps.forEach(timestamp => {
        const japanese = japaneseScript[timestamp];
        const english = englishScript[timestamp];

        if (japanese && japanese.text) {
            const entry = {
                time: timestamp,
                japanese: japanese.text,
                hiragana: convertToHiragana(japanese.text),
                english: english ? english.text : ""
            };

            combined.push(entry);
        }
    });

    return combined;
};

// Save JSON parts
const saveJsonParts = (entries, outputPrefix, entriesPerFile = 225) => {
    const totalEntries = entries.length;
    let partNum = 2; // Start from part 2
    let startIdx = 0;
    const partsCreated = [];

    while (startIdx < totalEntries) {
        const endIdx = Math.min(startIdx + entriesPerFile, totalEntries);
        const partEntries = entries.slice(startIdx, endIdx);

        const filename = `${outputPrefix}_Part${partNum}.json`;

        fs.writeFileSync(
            filename,
            JSON.stringify(partEntries, null, 2),
            'utf-8'
        );

        partsCreated.push({
            filename,
            entries: partEntries.length,
            startTime: partEntries[0]?.time || '',
            endTime: partEntries[partEntries.length - 1]?.time || ''
        });

        console.log(`Created ${filename} with ${partEntries.length} entries`);

        startIdx = endIdx;
        partNum++;
    }

    return partsCreated;
};

// Main function
const main = () => {
    try {
        console.log('Loading Japanese script...');
        const japaneseScript = loadScript(JAPANESE_FILE, 301);
        console.log(`Loaded ${Object.keys(japaneseScript).length} Japanese entries`);

        console.log('Loading English script...');
        const englishScript = loadScript(ENGLISH_FILE, 301);
        console.log(`Loaded ${Object.keys(englishScript).length} English entries`);

        console.log('\nCreating combined entries...');
        const combinedEntries = createCombinedEntries(japaneseScript, englishScript);
        console.log(`Created ${combinedEntries.length} combined entries`);

        console.log('\nSaving JSON files...');
        const parts = saveJsonParts(combinedEntries, OUTPUT_PREFIX, 225);

        console.log('\n' + '='.repeat(70));
        console.log('SUMMARY');
        console.log('='.repeat(70));
        console.log(`Total entries processed: ${combinedEntries.length}`);
        console.log(`Number of parts created: ${parts.length}`);
        console.log('\nParts details:');
        parts.forEach((part, index) => {
            console.log(`  Part ${index + 2}: ${part.filename}`);
            console.log(`    - Entries: ${part.entries}`);
            console.log(`    - Time range: ${part.startTime} - ${part.endTime}`);
        });

        return { parts: parts.length, total: combinedEntries.length };
    } catch (error) {
        console.error('ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

// Run
const result = main();
console.log(`\nProcessing complete: ${result.parts} parts, ${result.total} total entries`);
