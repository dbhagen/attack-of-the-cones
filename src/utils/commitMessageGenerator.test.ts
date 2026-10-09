import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateCommitMessage } from './commitMessageGenerator';

describe('generateCommitMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats "<type>: STORY-<id> <action> <subject> <detail>" deterministically for a seeded random stream', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    // Every pick resolves to the first entry of its word list, and the story id
    // formula floor(r * 9000) + 1000 yields its lower bound 1000.
    expect(generateCommitMessage()).toBe(
      'feat: STORY-1000 updated API endpoint for better performance'
    );
  });

  it('uses story ids up to 9999 when random returns values just below 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);

    expect(generateCommitMessage()).toMatch(/^style: STORY-9999 /);
  });

  it('always emits a conventional-commit-shaped message with a 4-digit story id', () => {
    const messages = Array.from({ length: 200 }, () => generateCommitMessage());

    for (const message of messages) {
      const match = /^([a-z]+): STORY-(\d{4}) (.+)$/.exec(message);
      if (!match) {
        throw new Error(`unexpected message shape: ${message}`);
      }
      const storyId = Number(match[2]);
      expect(storyId).toBeGreaterThanOrEqual(1000);
      expect(storyId).toBeLessThanOrEqual(9999);
    }

    // Five independent word lists feed each message: a single fixed output would
    // mean the randomness is not actually reaching the result.
    expect(new Set(messages).size).toBeGreaterThan(1);
  });
});
