#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to create combined JSON files for Evangelion 3.33 dialog scripts.
Combines Japanese and English scripts with hiragana readings.
"""

import json
import re
from typing import List, Dict, Tuple
import sys

# Japanese kana conversion mappings
KATAKANA_TO_HIRAGANA = {
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
    'ャ': 'ゃ', 'ュ': 'ゅ', 'ョ': 'ょ', 'ッ': 'っ',
    'ー': 'ー', '・': '・', '゛': '゛', '゜': '゜',
    'ヴ': 'ゔ'
}

# Common kanji to hiragana mappings for Evangelion context
KANJI_TO_HIRAGANA = {
    '私': 'わたし',
    '何': 'なに',
    '今': 'いま',
    '行': 'い',
    '来': 'き',
    '見': 'み',
    '言': 'い',
    '話': 'はなし',
    '聞': 'き',
    '思': 'おも',
    '分': 'わ',
    '出': 'で',
    '入': 'い',
    '本': 'ほん',
    '人': 'ひと',
    '時': 'とき',
    '目': 'め',
    '手': 'て',
    '好': 'す',
    '知': 'し',
    '命': 'めい',
    '大': 'おお',
    '小': 'ちい',
    '新': 'あたら',
    '古': 'ふる',
    '良': 'よ',
    '悪': 'わる',
    '高': 'たか',
    '低': 'ひく',
    '長': 'なが',
    '短': 'みじか',
    '多': 'おお',
    '少': 'すこ',
    '早': 'はや',
    '遅': 'おそ',
    '明': 'あか',
    '暗': 'くら',
    '重': 'じゅう',
    '軽': 'かる',
    '強': 'つよ',
    '弱': 'よわ',
    '全': 'ぜん',
    '半': 'はん',
    '開': 'ひら',
    '閉': 'と',
    '起': 'お',
    '動': 'うご',
    '止': 'と',
    '発': 'はっ',
    '進': 'すす',
    '退': 'しりぞ',
    '上': 'うえ',
    '下': 'した',
    '左': 'ひだり',
    '右': 'みぎ',
    '前': 'まえ',
    '後': 'うし',
    '中': 'なか',
    '外': 'そと',
    '内': 'うち',
    '父': 'ちち',
    '母': 'はは',
    '兄': 'あに',
    '姉': 'あね',
    '弟': 'おとうと',
    '妹': 'いもうと',
    '友': 'とも',
    '船': 'ふね',
    '機': 'き',
    '艦': 'かん',
    '戦': 'せん',
    '闘': 'とう',
    '撃': 'げき',
    '了': 'りょう',
    '解': 'かい',
    '準': 'じゅん',
    '備': 'び',
    '確': 'かく',
    '認': 'にん',
    '問': 'もん',
    '題': 'だい',
    '無': 'む',
    '正': 'せい',
    '常': 'じょう',
    '異': 'い',
    '変': 'へん',
    '死': 'し',
    '生': 'い',
    '気': 'き',
    '音': 'おと',
    '声': 'こえ',
    '楽': 'たの',
    '部': 'へ',
    '屋': 'や',
    '服': 'ふく',
    '年': 'ねん',
    '月': 'つき',
    '日': 'ひ',
    '星': 'ほし',
    '空': 'そら',
    '海': 'うみ',
    '山': 'やま',
    '火': 'ひ',
    '水': 'みず',
    '土': 'つち',
    '木': 'き',
    '金': 'きん',
    '銀': 'ぎん',
    '赤': 'あか',
    '青': 'あお',
    '白': 'しろ',
    '黒': 'くろ',
    '一': 'いち',
    '二': 'に',
    '三': 'さん',
    '四': 'よん',
    '五': 'ご',
    '六': 'ろく',
    '七': 'なな',
    '八': 'はち',
    '九': 'きゅう',
    '十': 'じゅう',
    '百': 'ひゃく',
    '千': 'せん',
    '万': 'まん',
}

def katakana_to_hiragana(text: str) -> str:
    """Convert katakana to hiragana"""
    result = ""
    for char in text:
        result += KATAKANA_TO_HIRAGANA.get(char, char)
    return result

def convert_to_hiragana(text: str) -> str:
    """
    Convert Japanese text to hiragana reading.
    This is a simplified conversion - for production use, you'd want
    to use a proper library like pykakasi or fugashi.
    """
    # First convert katakana to hiragana
    result = katakana_to_hiragana(text)

    # For kanji, we'll use simple substitution (limited coverage)
    # In a real implementation, you'd use a morphological analyzer
    for kanji, hiragana in KANJI_TO_HIRAGANA.items():
        result = result.replace(kanji, hiragana)

    return result

def parse_script_line(line: str) -> Tuple[str, str, str]:
    """
    Parse a script line in format: HH:MM:SS {speaker} text
    Returns: (timestamp, speaker, text)
    """
    # Pattern: line_number→HH:MM:SS {speaker} text
    pattern = r'^\s*\d+→(\d{2}:\d{2}:\d{2})\s*\{([^}]+)\}\s*(.+)$'
    match = re.match(pattern, line)

    if match:
        timestamp = match.group(1)
        speaker = match.group(2).strip()
        text = match.group(3).strip()
        return timestamp, speaker, text

    return None, None, None

def load_script(filepath: str, start_line: int = 1) -> Dict[str, Tuple[str, str]]:
    """
    Load script file and parse into dictionary keyed by timestamp.
    Returns: {timestamp: (speaker, text)}
    """
    script_dict = {}

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for i, line in enumerate(lines, 1):
        if i < start_line:
            continue

        timestamp, speaker, text = parse_script_line(line)
        if timestamp:
            script_dict[timestamp] = (speaker, text)

    return script_dict

def create_combined_entries(japanese_script: Dict[str, Tuple[str, str]],
                           english_script: Dict[str, Tuple[str, str]],
                           start_entry: int = 51) -> List[Dict]:
    """
    Create combined entries from Japanese and English scripts.
    """
    combined = []
    entry_num = start_entry

    # Get all timestamps and sort them
    all_timestamps = sorted(set(list(japanese_script.keys()) + list(english_script.keys())))

    for timestamp in all_timestamps:
        japanese_data = japanese_script.get(timestamp, ("", ""))
        english_data = english_script.get(timestamp, ("", ""))

        japanese_speaker, japanese_text = japanese_data
        english_speaker, english_text = english_data

        # Only create entry if we have Japanese text
        if japanese_text:
            hiragana_text = convert_to_hiragana(japanese_text)

            entry = {
                "time": timestamp,
                "japanese": japanese_text,
                "hiragana": hiragana_text,
                "english": english_text if english_text else ""
            }

            combined.append(entry)
            entry_num += 1

    return combined

def save_json_parts(entries: List[Dict], output_prefix: str, entries_per_file: int = 225):
    """
    Save entries into multiple JSON files.
    """
    total_entries = len(entries)
    part_num = 2  # Start from part 2 since part 1 is already done
    start_idx = 0

    parts_created = []

    while start_idx < total_entries:
        end_idx = min(start_idx + entries_per_file, total_entries)
        part_entries = entries[start_idx:end_idx]

        filename = f"{output_prefix}_Part{part_num}.json"

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(part_entries, f, ensure_ascii=False, indent=2)

        parts_created.append({
            'filename': filename,
            'entries': len(part_entries),
            'start_time': part_entries[0]['time'] if part_entries else '',
            'end_time': part_entries[-1]['time'] if part_entries else ''
        })

        print(f"Created {filename} with {len(part_entries)} entries")

        start_idx = end_idx
        part_num += 1

    return parts_created

def main():
    # File paths
    japanese_file = r"C:\Users\User\Desktop\251118 EvaScript\Evangelion_3.33_Script_Japanese.txt"
    english_file = r"C:\Users\User\Desktop\251118 EvaScript\Evangelion_3.33_Script.txt"
    output_prefix = r"C:\Users\User\Desktop\251118 EvaScript\Eva_3.33_Combined"

    print("Loading Japanese script...")
    japanese_script = load_script(japanese_file, start_line=301)
    print(f"Loaded {len(japanese_script)} Japanese entries")

    print("Loading English script...")
    english_script = load_script(english_file, start_line=301)
    print(f"Loaded {len(english_script)} English entries")

    print("\nCreating combined entries...")
    combined_entries = create_combined_entries(japanese_script, english_script, start_entry=51)
    print(f"Created {len(combined_entries)} combined entries")

    print("\nSaving JSON files...")
    parts = save_json_parts(combined_entries, output_prefix, entries_per_file=225)

    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Total entries processed: {len(combined_entries)}")
    print(f"Number of parts created: {len(parts)}")
    print("\nParts details:")
    for i, part in enumerate(parts, 1):
        print(f"  Part {i+1}: {part['filename']}")
        print(f"    - Entries: {part['entries']}")
        print(f"    - Time range: {part['start_time']} - {part['end_time']}")

    return len(parts), len(combined_entries)

if __name__ == "__main__":
    try:
        num_parts, total_entries = main()
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
