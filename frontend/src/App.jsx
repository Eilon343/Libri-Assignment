import { useEffect, useState } from "react";
import { fetchWords } from "./api";
import WordCloud from "./WordCloud";
import LoadingBar from "./LoadingBar";

function App() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchWords((update) => {
          if (!cancelled) {
            setProgress(update);
          }
        });
        if (!cancelled) {
          setWords(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      <h1>Word Cloud</h1>

      {loading && <LoadingBar progress={progress} />}
      {error && <p className="error">Failed to load: {error}</p>}
      {!loading && !error && <WordCloud words={words} />}
    </div>
  );
}
export default App;
