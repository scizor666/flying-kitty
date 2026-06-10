export interface ScoreEntry {
  name: string;
  score: number;
  timeSeconds: number;
  date: string;
}

const SCORES_KEY = 'cloudy.highscores';
const NAME_KEY = 'cloudy.playerName';
const MAX_ENTRIES = 10;

function isValidEntry(e: unknown): e is ScoreEntry {
  if (typeof e !== 'object' || e === null) return false;
  const entry = e as Record<string, unknown>;
  return (
    typeof entry.name === 'string' &&
    typeof entry.score === 'number' &&
    typeof entry.timeSeconds === 'number'
  );
}

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
  } catch {
    return [];
  }
}

/** Insert a finished game into the top-10; returns the new table and the
 *  entry's rank in it (-1 if it didn't make the cut). */
export function recordScore(entry: ScoreEntry): { scores: ScoreEntry[]; rank: number } {
  const scores = loadScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds);
  const top = scores.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(top));
  } catch {
    // storage full or unavailable — the game still works without records
  }
  return { scores: top, rank: top.indexOf(entry) };
}

export function loadPlayerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore — name autofill is a convenience only
  }
}
