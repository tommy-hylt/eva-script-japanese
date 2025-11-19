export type TextSegment = string | { kanji: string; reading: string };

export interface ScriptEntry {
  time: string;
  character: string;
  segments: TextSegment[];
  english: string;
}
