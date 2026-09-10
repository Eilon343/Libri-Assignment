//practical font-size range for the word cloud.
export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 64;

// Create a scaling function that maps word frequency to font size
export function createFontSizeScale(
  words,
  minFontSize = MIN_FONT_SIZE,
  maxFontSize = MAX_FONT_SIZE,
) {
  const counts = words.map((w) => w.value);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  return function fontSizeForWord(count) {
    //All words share the same frequenct edge case
    if (maxCount === minCount) {
      return (minFontSize + maxFontSize) / 2;
    }
    const ratio = (count - minCount) / (maxCount - minCount);
    return minFontSize + ratio * (maxFontSize - minFontSize);
  };
}
