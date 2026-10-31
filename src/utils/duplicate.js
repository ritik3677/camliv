/**
 * Duplicate detection utility for Campus Pulse.
 * Identifies duplicate events across messy forwards or repeated extractions.
 */

/**
 * Clean and normalize event title for comparison.
 * @param {string} title
 * @returns {string}
 */
export function normalizeTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // remove punctuation
    .replace(/\s+/g, ' ')      // collapse spaces
    .trim();
}

/**
 * Compute Dice coefficient bigram similarity between two strings (0.0 to 1.0).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function stringSimilarity(a, b) {
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);

  if (!normA && !normB) return 1.0;
  if (!normA || !normB) return 0.0;
  if (normA === normB) return 1.0;
  if (normA.includes(normB) || normB.includes(normA)) {
    // If one is a substantial substring of the other (e.g., "Math Final Exam" and "Math Final Exam 2026")
    const shorter = Math.min(normA.length, normB.length);
    const longer = Math.max(normA.length, normB.length);
    if (shorter / longer >= 0.7) return 0.9;
  }

  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bigramsA = getBigrams(normA);
  const bigramsB = getBigrams(normB);

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  const total = bigramsA.size + bigramsB.size;
  return total === 0 ? 0 : (2.0 * intersection) / total;
}

/**
 * Determine if candidate event is a duplicate of any existing event.
 *
 * @param {Object} candidate - { title, date, time, venue, category }
 * @param {Array<Object>} existingEvents
 * @param {number} [titleThreshold=0.75]
 * @returns {Object|null} Matching existing event, or null if unique
 */
export function findDuplicateEvent(candidate, existingEvents = [], titleThreshold = 0.75) {
  if (!candidate || !Array.isArray(existingEvents) || existingEvents.length === 0) {
    return null;
  }

  const candNormTitle = normalizeTitle(candidate.title);
  const candDate = candidate.date ? candidate.date.trim() : null;
  const candTime = candidate.time ? candidate.time.trim() : null;

  for (const existing of existingEvents) {
    // Skip if comparing same ID
    if (candidate.id && existing.id && candidate.id === existing.id) {
      continue;
    }

    const existNormTitle = normalizeTitle(existing.title);
    const existDate = existing.date ? existing.date.trim() : null;
    const existTime = existing.time ? existing.time.trim() : null;

    // 1. Exact title match
    const exactTitleMatch = candNormTitle.length > 0 && candNormTitle === existNormTitle;

    // 2. High title similarity
    const sim = stringSimilarity(candNormTitle, existNormTitle);
    const similarTitle = sim >= titleThreshold;

    if (exactTitleMatch || similarTitle) {
      // Both have dates: must match date
      if (candDate && existDate) {
        if (candDate === existDate) {
          // If both also have times, do they match or are close?
          if (candTime && existTime) {
            if (candTime === existTime || Math.abs(sim) > 0.85) {
              return existing;
            }
          } else {
            // Same date + same/similar title
            return existing;
          }
        }
      } else if (!candDate && !existDate) {
        // Neither has date, but title matches exactly
        if (exactTitleMatch) {
          return existing;
        }
      }
    }
  }

  return null;
}

/**
 * Filter an array of newly extracted candidate events against existing events.
 *
 * @param {Array<Object>} candidates
 * @param {Array<Object>} existingEvents
 * @returns {{ unique: Array<Object>, duplicates: Array<{ candidate: Object, match: Object }> }}
 */
export function partitionCandidatesByDuplicate(candidates = [], existingEvents = []) {
  const unique = [];
  const duplicates = [];
  const currentPool = [...existingEvents];

  for (const cand of candidates) {
    const match = findDuplicateEvent(cand, currentPool);
    if (match) {
      duplicates.push({ candidate: cand, match });
    } else {
      unique.push(cand);
      currentPool.push(cand); // avoid intra-batch duplicates as well
    }
  }

  return { unique, duplicates };
}

