# Data Pipeline

## Goal

Generate static JSON study data for all 4 Evangelion Rebuild movies from JP and EN TTML2 subtitle files, while keeping the process reproducible and inspectable.

## Source Files

Source files live in `prepare/sources/ttml/`:

- `Eva1-JP.ttml2`
- `Eva1-EN.ttml2`
- `Eva2-JP.ttml2`
- `Eva2-EN.ttml2`
- `Eva3-JP.ttml2`
- `Eva3-EN.ttml2`
- `Eva4-JP.ttml2`
- `Eva4-EN.ttml2`

Chinese TTML files are intentionally excluded from the active flow.

## Build Steps

Run from `prepare/`:

```bash
npm run prepare:data
```

This script:

1. Parses TTML `<p>` entries from JP and EN tracks.
2. Extracts existing ruby markup from JP when present.
3. Generates furigana for remaining Japanese segments with `kuroshiro` + `kuromoji`.
4. Uses Japanese timing as the primary timeline.
5. Matches overlapping English subtitle lines onto each Japanese entry.
6. Extracts leading speaker labels like `（ミサト）` into the `character` field when the line also contains spoken text.
7. Splits each movie into 5-6 paged JSON parts.
8. Writes final app data to `web/src/data/<movie-id>/part-N.json`.
9. Writes intermediate aligned output and summary reports to `prepare/workspace/`.

## Output Files

Final app data:

- `web/src/data/manifest.json`
- `web/src/data/eva-1.11/part-1.json` ...
- `web/src/data/eva-2.22/part-1.json` ...
- `web/src/data/eva-3.33/part-1.json` ...
- `web/src/data/eva-3.0-plus-1.01/part-1.json` ...

Intermediate review files:

- `prepare/workspace/intermediate/<movie-id>-aligned.json`
- `prepare/workspace/reports/<movie-id>-summary.json`

## Validation

Run from `prepare/`:

```bash
npm run validate:data
```

The validator checks:

- part counts and total counts
- duplicate ids
- invalid or unsorted timestamps
- empty or malformed segments
- non-string `character` / `english` fields
- empty-English counts for review

## Data Shape

Each final entry looks like:

```json
{
  "id": "eva-1.11-0001",
  "time": "00:00:44.295",
  "timeEnd": "00:00:50.050",
  "character": "",
  "segments": [
    "（せみの",
    { "kanji": "声", "reading": "こえ" },
    "）"
  ],
  "english": ""
}
```

`segments` is designed for React ruby rendering:

- plain strings stay plain
- `{ "kanji": "...", "reading": "..." }` objects render as ruby annotations

## Known Limitations

- EN alignment is overlap-based, not semantic sentence matching.
- Generated furigana is automatic and may need manual correction for names, special terms, or context-specific readings.
- Some lines are pure sound effects or system text and intentionally do not get a `character` value.
