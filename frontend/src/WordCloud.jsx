import { useEffect, useState } from "react";
import cloud from "d3-cloud";
import { colorForWord } from "./colors";
import { createFontSizeScale } from "./scaling";

const WIDTH = 1000;
const HEIGHT = 600;


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
                }))
            )
            .padding(2)
            .rotate(() => (Math.random() < 0.5 ? 0 : 90))
            .font("sans-serif")
            .fontSize((d) => d.size)
            .on("end", (computed) => setLayoutWords(computed));

        layout.start();

        return () => layout.stop();
    }, [words]);

      return (
    <svg width={WIDTH} height={HEIGHT} className="word-cloud">
      <g transform={`translate(${WIDTH / 2}, ${HEIGHT / 2})`}>
        {layoutWords.map((w) => (
          <text
            key={w.text}
            textAnchor="middle"
            transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
            style={{ fontSize: w.size, fontFamily: "sans-serif", fill: colorForWord(w.text) }}
          >
            {w.text}
          </text>
        ))}
      </g>
    </svg>
  );
}

export default WordCloud;