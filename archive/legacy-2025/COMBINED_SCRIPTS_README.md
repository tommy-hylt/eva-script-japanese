# Evangelion 3.33 Combined Scripts - JSON Format

This folder contains the combined Japanese and English dialog scripts for Evangelion 3.33 in JSON format.

## Files Created

**6 JSON files total:**

- **Eva_3.33_Combined_Part1.json** - 50 entries with full hiragana (00:11:00 - 00:12:22)
- **Eva_3.33_Combined_Part2.json** - 225 entries (00:11:46 - 00:27:30)
- **Eva_3.33_Combined_Part3.json** - 225 entries (00:27:31 - 00:44:29)
- **Eva_3.33_Combined_Part4.json** - 225 entries (00:44:33 - 01:03:11)
- **Eva_3.33_Combined_Part5.json** - 225 entries (01:03:15 - 01:20:01)
- **Eva_3.33_Combined_Part6.json** - 106 entries (01:20:03 - 01:41:39)

**Total: 1,056 entries covering the entire movie**

## JSON Format

Each entry follows this structure:

```json
{
  "time": "HH:MM:SS",
  "japanese": "Japanese dialog text",
  "hiragana": "Hiragana reading",
  "english": "English translation"
}
```

## About the Hiragana Field

**Part 1 (first 50 entries)**: Contains manually curated hiragana readings with proper kanji-to-hiragana conversion.

**Parts 2-6**: The hiragana field currently mirrors the Japanese text. Full kanji-to-hiragana conversion requires specialized Japanese morphological analysis tools (like MeCab, Kuromoji, or pykakasi) which perform:
- Kanji → Hiragana conversion (e.g., 重力 → じゅうりょく)
- Katakana → Hiragana conversion (e.g., エリア → えりあ)
- Proper word segmentation and reading assignment

### To Complete Hiragana Conversion:

You can use these tools to generate full hiragana readings:

1. **Online Tools:**
   - [Hiragana Megane](https://www.hiragana.jp/) - Paste Japanese text to get hiragana readings
   - [Furigana Generator](https://www.japanese.io/furigana-generator)

2. **Python Libraries:**
   ```python
   # Install: pip install pykakasi
   from pykakasi import kakasi

   kks = kakasi()
   result = kks.convert("重力制御、未経験です。")
   hiragana = ''.join([item['hira'] for item in result])
   # Output: じゅうりょくせいぎょ、みけいけんです。
   ```

3. **JavaScript Libraries:**
   ```javascript
   // npm install kuroshiro kuroshiro-analyzer-kuromoji
   const Kuroshiro = require("kuroshiro");
   const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");

   const kuroshiro = new Kuroshiro();
   await kuroshiro.init(new KuromojiAnalyzer());
   const result = await kuroshiro.convert("重力制御、未経験です。", { to: "hiragana" });
   // Output: じゅうりょくせいぎょ、みけいけんです。
   ```

## Data Alignment

- Entries are aligned by timestamp between Japanese and English scripts
- Some entries may have empty English fields where timestamps don't match exactly
- All timestamps preserve the original format including "??" for uncertain seconds

## Statistics

- **Total entries**: 1,056
- **Time range**: 00:11:00 to 01:41:39
- **Entries with both JP & EN**: ~940+
- **Japanese-only entries**: ~60+ (technical dialogue, overlapping lines)

## Usage Examples

### Loading in JavaScript:
```javascript
const part1 = require('./Eva_3.33_Combined_Part1.json');
console.log(part1[0]);
// {
//   time: "00:11:00",
//   japanese: "追跡班、両機の現在位置を報告。",
//   hiragana: "ついせきはん、りょうきのげんざいいちをほうこく。",
//   english: "Tracking team, report on both units' current positions."
// }
```

### Loading in Python:
```python
import json

with open('Eva_3.33_Combined_Part1.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for entry in data[:3]:
    print(f"{entry['time']}: {entry['japanese']}")
```

### Search by Timestamp:
```javascript
function findByTime(parts, time) {
  for (const part of parts) {
    const entry = part.find(e => e.time === time);
    if (entry) return entry;
  }
  return null;
}
```

## Source Files

- **Japanese Source**: `Evangelion_3.33_Script_Japanese.txt` (1,373 lines)
- **English Source**: `Evangelion_3.33_Script.txt` (1,346 lines)

## Notes

- These are fan-created transcripts, not official Studio Khara releases
- Part 1 hiragana is manually verified for accuracy
- Parts 2-6 hiragana fields need processing with Japanese NLP tools
- Some technical terms and proper nouns are intentionally kept in katakana/kanji
- Speaker names are removed from the dialog text for cleaner data

## Recommended Next Steps

1. Process Parts 2-6 through a hiragana converter tool
2. Validate alignment between Japanese and English entries
3. Add speaker fields if needed for character-specific analysis
4. Create a single combined file if preferred (all parts merged)
