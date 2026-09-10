const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 15,
});

const httpClient = axios.create({
    httpsAgent: httpsAgent,
    timeout: 10000, // Set a timeout of 10 seconds for each request
});

const API_URL = 'https://random-word-api.herokuapp.com/word?number=1';

// Fetch a single word from the API
async function fetchOneWord(retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const { data } = await httpClient.get(API_URL);
            if (Array.isArray(data) && data.length > 0) {
                return data[0];
            }
            return null;
        } catch (error) {
            if (attempt === retries) {
                console.error('Error fetching word:', error.message);
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
        }
    }
};
// Fetch multiple words concurrently with a limit on the number of concurrent requests and sending back progress updates to the client via SSE
async function fetchWords(totalWords, concurrency, onProgress) {
    const words = [];
    let nextIndex = 0;
    let completed = 0;
    const logEvery = Math.max(1, Math.floor(totalWords / 20));

    async function worker() {
        while (nextIndex < totalWords) {
            nextIndex++;
            const word = await fetchOneWord();
            if (word) words.push(word);

            completed++;
            if (completed % logEvery === 0 || completed === totalWords) {
                const pct = ((completed / totalWords) * 100).toFixed(0);
                console.log(`Progress: ${completed}/${totalWords} (${pct}%) - ${words.length} words collected`);

                
                if (onProgress) {
                    onProgress({ completed, total: totalWords, collected: words.length });
                }
            }
        }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return words;
}

// get words route with SSE support
app.get('/api/words', async (req, res) => {
    //SSE setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    //Helper: write one SSE event to the open response.
    const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    //If the client disconnects mid-run, stop caring about this request.
    let clientGone = false;
    req.on('close', () => { clientGone = true; });

    try {
        console.log('Starting 6000 API requests.');
        const startTime = Date.now();

        const words = await fetchWords(6000, 15, (progress) => {
            if (!clientGone) {
                sendEvent('progress', progress);
            }
        });

        // Count frequencies
        const frequencyMap = {};
        words.forEach(word => {
            frequencyMap[word] = (frequencyMap[word] || 0) + 1;
        });
        const formattedData = Object.keys(frequencyMap).map(word => ({
            text: word,
            value: frequencyMap[word],
        }));

        const durationInSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`Fetched and processed 6000 words in ${durationInSeconds} seconds.`);

        if (!clientGone) {
            sendEvent('done', formattedData);
        }
        res.end();
    } catch (error) {
        console.error('Error in /api/words route:', error);
        if (!clientGone) {
            sendEvent('error', { message: 'Internal Server Error' });
        }
        res.end();
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
