import re
import json
from pathlib import Path

def parse_japanese_script(file_path):
    """Parse Japanese script file with format: timestamp {speaker} dialogue"""
    entries = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or line.startswith('*') or line.startswith('format:'):
                continue

            # Match pattern: HH:MM:SS {speaker} dialogue
            match = re.match(r'(\d{2}:\d{2}:\d{2}|\d{2}:\d{2}:\?\?)\s*\{([^}]+)\}\s*(.+)', line)
            if match:
                time, speaker, text = match.groups()
                entries.append({
                    'time': time,
                    'speaker': speaker.strip(),
                    'text': text.strip()
                })
    return entries

def parse_english_script(file_path):
    """Parse English script file with format: timestamp {speaker} dialogue"""
    entries = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            # Match pattern: HH:MM:SS {speaker} dialogue
            match = re.match(r'(\d{2}:\d{2}:\d{2}|\d{2}:\d{2}:\?\?)\s*\{([^}]+)\}\s*(.+)', line)
            if match:
                time, speaker, text = match.groups()
                entries.append({
                    'time': time,
                    'speaker': speaker.strip(),
                    'text': text.strip()
                })
    return entries

def time_to_seconds(time_str):
    """Convert HH:MM:SS to seconds for comparison. Handle ?? in time."""
    if '??' in time_str:
        # Replace ?? with 00 for comparison purposes
        time_str = time_str.replace('??', '00')
    parts = time_str.split(':')
    return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])

def align_scripts(japanese_entries, english_entries):
    """Align Japanese and English entries by timestamp"""
    aligned = []

    # Create dictionaries indexed by time
    jp_dict = {}
    for entry in japanese_entries:
        time = entry['time']
        if time not in jp_dict:
            jp_dict[time] = []
        jp_dict[time].append(entry)

    en_dict = {}
    for entry in english_entries:
        time = entry['time']
        if time not in en_dict:
            en_dict[time] = []
        en_dict[time].append(entry)

    # Get all unique timestamps
    all_times = sorted(set(list(jp_dict.keys()) + list(en_dict.keys())),
                       key=time_to_seconds)

    for time in all_times:
        jp_entries = jp_dict.get(time, [])
        en_entries = en_dict.get(time, [])

        # Match entries at the same timestamp
        max_len = max(len(jp_entries), len(en_entries))
        for i in range(max_len):
            jp_entry = jp_entries[i] if i < len(jp_entries) else None
            en_entry = en_entries[i] if i < len(en_entries) else None

            aligned.append({
                'time': time,
                'japanese': jp_entry['text'] if jp_entry else '',
                'japanese_speaker': jp_entry['speaker'] if jp_entry else '',
                'english': en_entry['text'] if en_entry else '',
                'english_speaker': en_entry['speaker'] if en_entry else '',
                'hiragana': ''  # To be filled later
            })

    return aligned

def main():
    base_path = Path(r'C:\Users\User\Desktop\251118 EvaScript')

    # Parse both scripts
    print("Parsing Japanese script...")
    japanese_entries = parse_japanese_script(base_path / 'Evangelion_3.33_Script_Japanese.txt')
    print(f"Found {len(japanese_entries)} Japanese entries")

    print("Parsing English script...")
    english_entries = parse_english_script(base_path / 'Evangelion_3.33_Script.txt')
    print(f"Found {len(english_entries)} English entries")

    # Align scripts
    print("Aligning scripts by timestamp...")
    aligned = align_scripts(japanese_entries, english_entries)
    print(f"Created {len(aligned)} aligned entries")

    # Split into multiple files (200 entries per file to keep files manageable)
    entries_per_file = 200
    num_files = (len(aligned) + entries_per_file - 1) // entries_per_file

    for file_num in range(num_files):
        start_idx = file_num * entries_per_file
        end_idx = min((file_num + 1) * entries_per_file, len(aligned))

        chunk = aligned[start_idx:end_idx]
        output_file = base_path / f'Eva_3.33_Combined_Part{file_num + 1}.json'

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(chunk, f, ensure_ascii=False, indent=2)

        print(f"Created {output_file.name} with {len(chunk)} entries")

    # Also create a summary file
    summary = {
        'total_entries': len(aligned),
        'num_files': num_files,
        'entries_per_file': entries_per_file,
        'files': [f'Eva_3.33_Combined_Part{i+1}.json' for i in range(num_files)]
    }

    with open(base_path / 'Eva_3.33_Combined_Summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print("\nProcessing complete!")
    print(f"Total entries: {len(aligned)}")
    print(f"Files created: {num_files}")

if __name__ == '__main__':
    main()
