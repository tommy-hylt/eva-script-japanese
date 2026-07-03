export type TextSegment = string | { kanji: string; reading: string };

export interface ScriptEntry {
  id: string;
  time: string;
  timeEnd: string;
  character: string;
  segments: TextSegment[];
  english: string;
}
