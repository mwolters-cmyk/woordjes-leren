/**
 * Levenshtein distance between two strings.
 * Used to allow small typos in written answers.
 */
export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if an answer is correct, with optional fuzzy matching.
 * - Exact match (case-insensitive, trimmed)
 * - Fuzzy match with Levenshtein distance <= maxDistance
 * Returns: "correct" | "close" | "incorrect"
 */
export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  maxDistance: number = 1
): "correct" | "close" | "incorrect" {
  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  if (normalizedUser === normalizedCorrect) return "correct";

  // For very short words (<=3 chars), require exact match
  if (normalizedCorrect.length <= 3) return "incorrect";

  const distance = levenshtein(normalizedUser, normalizedCorrect);
  if (distance <= maxDistance) return "close";

  // Also check if the answer contains multiple valid translations (separated by ,  / or ;)
  const alternatives = correctAnswer.split(/[,;\/]/).map((s) => s.trim().toLowerCase());
  for (const alt of alternatives) {
    if (normalizedUser === alt) return "correct";
    if (alt.length > 3 && levenshtein(normalizedUser, alt) <= maxDistance) return "close";
  }

  return "incorrect";
}

/**
 * Normalize accented characters for comparison purposes.
 * NOT used for exact matching - just for "did they get close" feedback.
 */
export function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
