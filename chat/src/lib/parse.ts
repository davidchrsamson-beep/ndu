// Turns "I need a red owambe dress, size 12, under 30k" into
// keywords ["red", "owambe", "dress"] and a budget of ₦30,000.

export type ParsedRequest = { keywords: string[]; budgetKobo: number | null };

// Words that don't help find a product.
const STOPWORDS = new Set([
  "i", "im", "need", "want", "wants", "looking", "look", "for", "buy", "buying", "get", "find", "some",
  "something", "like", "this", "that", "these", "those", "but", "and", "the", "any", "can", "you", "your",
  "help", "please", "pls", "abeg", "with", "under", "below", "less", "than", "more", "max", "maximum",
  "budget", "naira", "ngn", "around", "about", "size", "sizes", "delivered", "delivery", "deliver",
  "calabar", "week", "today", "tomorrow", "asap", "cheap", "good", "nice", "quality", "new", "my", "mum",
  "mom", "who", "what", "where", "how", "sell", "sells", "selling", "have", "has", "one", "two", "pair",
  "pieces", "piece", "her", "him", "his", "she", "they", "them", "our", "from", "into", "also", "very",
  "really", "just", "all", "not", "are", "was", "will", "would", "should", "could", "dey", "wan", "una",
  "make", "there", "here", "same", "colour", "color", "it", "is", "in", "of", "on", "at", "by", "to", "a", "an",
]);

export function parseRequest(text: string): ParsedRequest {
  const lower = text.toLowerCase();

  // Budget: "30k", "₦30,000", "30000" (but not "size 12" — small bare numbers are ignored).
  let budgetKobo: number | null = null;
  for (const m of lower.matchAll(/(₦|ngn\s?)?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s?(k|thousand)?(?![\w])/g)) {
    const hasK = Boolean(m[3]);
    let naira = Number(m[2].replace(/,/g, ""));
    if (hasK) naira *= 1000;
    if (hasK || m[1] || naira >= 1000) {
      budgetKobo = Math.round(naira * 100);
      break;
    }
  }

  // Keywords: drop numbers and filler words, keep up to 8 useful words.
  const words = lower
    .replace(/(₦|ngn)?\s?\d[\d,.]*\s?(k|thousand)?\b/g, " ")
    .split(/[^a-z']+/)
    .map((w) => w.replace(/'s$/, "").replace(/'/g, ""))
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

  return { keywords: [...new Set(words)].slice(0, 8), budgetKobo };
}