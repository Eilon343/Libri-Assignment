import { useEffect, useState } from "react";
import cloud from "d3-cloud";
import { colorForWord } from "./colors";
import { createFontSizeScale } from "./scaling";

// The layout canvas. Large on purpose: with ~5000 mostly-unique words, d3-cloud
// silently drops any word it cannot place, so a bigger area + tight padding fits
// far more of them. The SVG is scaled down to the viewport via `viewBox`.
const WIDTH = 1920;
const HEIGHT = 1080;
const PADDING = 1;
const MARGIN = 12; // a little breathing room so edge words are not clipped

function WordCloud({ words }) {
  const [layoutWords, setLayoutWords] = useState([]);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const fontSizeForWord = createFontSizeScale(words);

    const layout = cloud()
      .size([WIDTH, HEIGHT])
      .words(
        words.map((w) => ({
          text: w.text,
          size: fontSizeForWord(w.value),
        })),
      )
      .padding(PADDING)
      .rotate(() => (Math.random() < 0.5 ? 0 : 90))
      .font("sans-serif")
      .fontSize((d) => d.size)
      .on("end", (computed) => setLayoutWords(computed));

    layout.start();

    // Stop the async layout if `words` changes or the component unmounts.
    return () => layout.stop();
  }, [words]);

  // d3-cloud positions words around the origin (0, 0), so the viewBox is
  // centered there rather than translating a <g>.
  const viewBox = [
    -WIDTH / 2 - MARGIN,
    -HEIGHT / 2 - MARGIN,
    WIDTH + MARGIN * 2,
    HEIGHT + MARGIN * 2,
  ].join(" ");

  return (
    <svg
      className="word-cloud"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
    >
      {layoutWords.map((w) => (
        <text
          key={w.text}
          textAnchor="middle"
          transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
          style={{
            fontSize: w.size,
            fontFamily: "sans-serif",
            fill: colorForWord(w.text),
          }}
        >
          {w.text}
        </text>
      ))}
    </svg>
  );
}

export default WordCloud;
