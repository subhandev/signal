import { SUGGESTED_PROMPTS } from './suggestedPrompts.data';

const DISPLAY_COUNT = 4;

function randomPick(pool: readonly string[], count: number): string[] {
  if (pool.length <= count) return [...pool];
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/** Random sample from the curated catalog (new picks every call). */
export function getSuggestedPrompts(count = DISPLAY_COUNT): string[] {
  return randomPick(SUGGESTED_PROMPTS, count);
}

export function getSuggestionPeriodLabel(): string {
  return 'Popular topics';
}

export function getPromptCatalogSize(): number {
  return SUGGESTED_PROMPTS.length;
}
