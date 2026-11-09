import botRepliesData from '../data/botReplies.json';

/**
 * Normalizes user input by converting to lowercase and stripping punctuation.
 * E.g., "Hello, who are you?!?" => "hello who are you"
 */
export function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines the best bot response based on keyword matching.
 *
 * Algorithm:
 * 1. Clean the input string (lowercase, remove punctuation, single spaces).
 * 2. For each category, count keyword matches:
 *    - Multi-word phrases (e.g. "who are you") are matched via substring inclusion with higher weight.
 *    - Single words (e.g. "hi") are matched with word boundaries (\bkeyword\b) to avoid false positives (e.g. "ship").
 * 3. Pick the category with the highest match score.
 * 4. Select a random reply from the matched category (or fallback if no keywords matched).
 *
 * @param {string} userMessage - Raw message string from the user
 * @param {string|null} lastReply - The previous bot reply to avoid immediate duplicate text
 * @returns {string} The chosen bot response
 */
export function getBotReply(userMessage, lastReply = null) {
  const cleanText = normalizeText(userMessage);

  if (!cleanText) {
    return getRandomReply(botRepliesData.fallback, lastReply);
  }

  let bestCategory = null;
  let highestHits = 0;

  for (const category of botRepliesData.categories) {
    let hits = 0;

    for (const keyword of category.keywords) {
      const cleanKeyword = normalizeText(keyword);
      if (!cleanKeyword) continue;

      if (cleanKeyword.includes(' ')) {
        // Multi-word phrase matching: give higher weight (3 points)
        if (cleanText.includes(cleanKeyword)) {
          hits += 3;
        }
      } else {
        // Single word matching with word boundaries (1 point)
        const wordRegex = new RegExp(`\\b${cleanKeyword}\\b`, 'i');
        if (wordRegex.test(cleanText)) {
          hits += 1;
        }
      }
    }

    if (hits > highestHits) {
      highestHits = hits;
      bestCategory = category;
    }
  }

  // If a category matched with at least one hit, select from its replies
  if (bestCategory && highestHits > 0) {
    return getRandomReply(bestCategory.replies, lastReply);
  }

  // Fallback if no keywords matched
  return getRandomReply(botRepliesData.fallback, lastReply);
}

/**
 * Helper to pick a random item from an array, avoiding matching lastReply if possible.
 */
export function getRandomReply(repliesArray, lastReply = null) {
  if (!Array.isArray(repliesArray) || repliesArray.length === 0) {
    return "I'm here to talk chess!";
  }

  if (repliesArray.length === 1) {
    return repliesArray[0];
  }

  // Filter out the last reply to prevent immediate repetition
  const filtered = lastReply
    ? repliesArray.filter((reply) => reply !== lastReply)
    : repliesArray;

  const candidatePool = filtered.length > 0 ? filtered : repliesArray;
  const randomIndex = Math.floor(Math.random() * candidatePool.length);
  return candidatePool[randomIndex];
}

