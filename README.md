# Word Cloud Generator

A full-stack application that fetches 6000 random words from an external API,
computes the frequency of every unique word, and renders the result as an
interactive word cloud.

**Stack**

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Backend  | Node.js, TypeScript, Express                 |
| Frontend | React, Vite, [`d3-cloud`](https://github.com/jasondavies/d3-cloud) for layout |
| Packaging| Docker, Docker Compose, nginx               |

---

## Project structure

```
.
├── backend/                # Express API server (TypeScript)
│   ├── src/server.ts       # Single GET route: /api/words
│   ├── Dockerfile
│   └── ...
├── frontend/               # React single-page app
│   ├── src/
│   │   ├── api.js          # EventSource client for the API
│   │   ├── scaling.js      # Frequency -> font-size scaling function
│   │   ├── colors.js       # Per-word persistent color
│   │   ├── WordCloud.jsx   # d3-cloud layout + SVG rendering
│   │   └── LoadingBar.jsx  # Progress bar shown during the fetch
│   ├── nginx.conf          # Serves the bundle + proxies /api to the backend
│   └── Dockerfile
└── docker-compose.yml      # Runs the whole stack
```

---

## Prerequisites

- **Docker** and **Docker Compose** — for the containerized run (recommended).
- **Node.js 22+** and **npm** — for running the two services locally.

---

## Running with Docker (recommended)

From the repository root:

```bash
docker compose up --build
```

Then open **http://localhost:8080**.

- The frontend container (nginx) serves the built React bundle on port `8080`.
- The backend container is **not** published to the host. nginx proxies every
  `/api/` request to `http://backend:3000` over the internal Docker network, so
  the browser only ever talks to a single origin.
- The first cloud takes **~3–4 minutes** to appear — the backend makes 6000
  calls to the word API, which is a single small instance that tops out around
  40 requests/second. A progress bar with a live percentage is shown while this
  runs.

To stop:

```bash
docker compose down
```

---

## Running locally (development)

### Backend

```bash
cd backend
npm install
npm run dev
```

- Starts on port `3000` (override with the `PORT` environment variable).
- Production build: `npm run build` then `npm start` (compiles `src/` to `dist/`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Vite dev server runs on **http://localhost:5173**.
- The API base URL comes from `VITE_API_URL`. If it is not set, the app falls
  back to `http://localhost:3000`, which matches the local backend above.
- Copy `frontend/.env.example` to `frontend/.env` if you need to point at a
  different backend.

---

## API

### `GET /api/words`

Fetches `https://random-word-api.herokuapp.com/word?number=1` **6000 times**
(`number=1` is never changed, so every call returns exactly one word), then
counts how many times each unique word appeared.

The response is a **Server-Sent Events** stream rather than a single JSON body,
so the frontend can show fetch progress during the long-running request:

| Event      | Payload                                             |
| ---------- | -------------------------------------------------- |
| `progress` | `{ completed, total, collected }` — emitted every 5% |
| `done`     | `[{ text: string, value: number }, ...]` — the final frequency data |
| `error`    | `{ message: string }`                              |

Requests are issued with a bounded concurrency of 15 over a keep-alive HTTPS
agent, and each individual call retries up to twice before being skipped.

---

## Scaling function (font sizes)

Implemented in [`frontend/src/scaling.js`](frontend/src/scaling.js).

`createFontSizeScale(words)` builds a **linear** map from a word's raw frequency
to a font size in the range **12px – 64px**:

1. Find the minimum and maximum frequency across all words (`minCount`,
   `maxCount`).
2. Normalize each frequency to a `0..1` ratio:
   `ratio = (count - minCount) / (maxCount - minCount)`.
3. Map that ratio into the font-size range:
   `fontSize = 12 + ratio * (64 - 12)`.

So the least frequent word renders at 12px, the most frequent at 64px, and
everything in between scales **directly proportionally** to its count.

**Edge case:** if every word has the same frequency, the ratio is undefined, so
the function returns the midpoint of the range (38px).

---


## Notes and trade-offs

- **Displaying every unique word.** 6000 draws yield ~5000 mostly single-occurrence
  words. `d3-cloud` silently drops any word it cannot place, so the layout uses a
  large canvas (1920×1080) with tight padding to fit as many as possible,
  largest-first. A cloud that renders all ~5000 words legibly is not feasible.
- **`React.StrictMode` is disabled** in `main.jsx`. In development it double-invokes
  effects, which fired the ~3-minute fetch twice. In production it never
  double-invokes, so this only affects local dev.

---

## Verifying the build

```bash
# backend
cd backend && npm ci && npm run build

# frontend
cd frontend && npm ci && npm run build

# full stack
docker compose up --build
```
