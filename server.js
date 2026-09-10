const express = require('express');
const axios = require('axios');
const https = require('https');

const app = express();
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
// Fetch multiple words concurrently with a limit on the number of concurrent requests
async function fetchWords(totalWords, concurrency) {
    const words = [];
    let nextIndex = 0;
    let completed = 0;
    const logEvery = Math.max(1, Math.floor(totalWords / 20)); // ~20 progress lines

    // Worker function to fetch words concurrently
    async function worker() {
        while (nextIndex < totalWords) {
            nextIndex++;
            // Fetch a single word
            const word = await fetchOneWord();
            if (word) words.push(word);

            completed++;
            if (completed % logEvery === 0 || completed === totalWords) {
                const pct = ((completed / totalWords) * 100).toFixed(0);
                console.log(`Progress: ${completed}/${totalWords} (${pct}%) - ${words.length} words collected`);
            }
        }
    }

    await Promise.all(
        Array.from({ length: concurrency }, () => worker())
    );
    return words;
}

app.get('/api/words', async (req, res) => {
    try {
        console.log('Starting 6000 API requests.');
        const startTime = Date.now();
        const words = await fetchWords(6000, 15);

        const frequencyMap = {};
        // Count the frequency of each word
        words.forEach(word => {
            frequencyMap[word] = (frequencyMap[word] || 0) + 1;
        });

        // Format the data for the frontend.
        const formattedData = Object.keys(frequencyMap).map(word => ({
            text: word,
            value: frequencyMap[word]
        }));

        //calculate the duration of the API requests and processing
        const endTime = Date.now();
        const durationInSeconds = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`Fetched and processed 6000 words in ${durationInSeconds} seconds.`);

        res.json(formattedData);
    } catch (error) {
        console.error('Error in /api/words route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
