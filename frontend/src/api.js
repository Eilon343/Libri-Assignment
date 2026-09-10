const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function fetchWords(onProgress) {
  return new Promise((resolve, reject) => {
    const source = new EventSource(`${API_URL}/api/words`);

    source.addEventListener("progress", (event) => {
      if (onProgress) {
        onProgress(JSON.parse(event.data));
      }
    });

    source.addEventListener("done", (event) => {
      source.close();
      resolve(JSON.parse(event.data));
    });

    source.addEventListener("error", (event) => {
      source.close();
      const message = event.data
        ? JSON.parse(event.data).message
        : "Connection to server failed";
      reject(new Error(message));
    });
  });
}
