import json
import re

# Read the original Japanese script and build a mapping
print("Reading original Japanese script...")
time_to_character = {}
with open(r'C:\Users\User\Desktop\251118 EvaScript\Evangelion_3.33_Script_Japanese.txt', 'r', encoding='utf-8') as f:
    for line in f:
        # Match lines like: 00:14:07 {アスカ} 　　　重力制御、未経験です。
        match = re.match(r'^(\d{2}:\d{2}:\d{2})\s+\{([^}]+)\}', line)
        if match:
            time = match.group(1)
            character = match.group(2)
            time_to_character[time] = character

print(f"Found {len(time_to_character)} character mappings")

# Process each JSON file
json_files = [
    r'C:\Users\User\Desktop\251118 EvaScript\eva-script-japanese\src\data\Eva_3.33_Combined_Part2.json',
    r'C:\Users\User\Desktop\251118 EvaScript\eva-script-japanese\src\data\Eva_3.33_Combined_Part3.json',
    r'C:\Users\User\Desktop\251118 EvaScript\eva-script-japanese\src\data\Eva_3.33_Combined_Part4.json',
    r'C:\Users\User\Desktop\251118 EvaScript\eva-script-japanese\src\data\Eva_3.33_Combined_Part5.json',
    r'C:\Users\User\Desktop\251118 EvaScript\eva-script-japanese\src\data\Eva_3.33_Combined_Part6.json'
]

for json_file in json_files:
    print(f"\nProcessing {json_file}...")

    # Read JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Add character field
    matched = 0
    unmatched = 0
    for entry in data:
        time = entry.get('time')
        if time and time in time_to_character:
            # Create new ordered dict with character after time
            new_entry = {'time': entry['time']}
            new_entry['character'] = time_to_character[time]
            # Add remaining fields
            for key in entry:
                if key != 'time':
                    new_entry[key] = entry[key]
            # Update entry
            entry.clear()
            entry.update(new_entry)
            matched += 1
        else:
            # No character found - add empty character field
            new_entry = {'time': entry['time']}
            new_entry['character'] = ''
            for key in entry:
                if key != 'time':
                    new_entry[key] = entry[key]
            entry.clear()
            entry.update(new_entry)
            unmatched += 1

    print(f"  Matched: {matched}, Unmatched: {unmatched}")

    # Write updated JSON file
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  Updated {json_file}")

print("\nAll files updated successfully!")
