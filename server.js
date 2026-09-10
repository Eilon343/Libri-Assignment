const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = 'https://random-word-api.herokuapp.com/word?number=1';

// Function to fetch words in batches to prevent overwhelming the API with too many requests.
async function fetchWordsInBatches(totalWords, batchSize) {
    let allWords = [];

    for (let i = 0; i < totalWords; i += batchSize) {
        // Calculate the current batch size, which may be smaller than the specified batch size.
        const currBatchSize = Math.min(batchSize, totalWords - i);
        const batchPromises = [];

        // Create an array of promises for the current batch of API requests.
        for (let j = 0; j < currBatchSize; j++) {
            batchPromises.push(axios.get(API_URL, {timeout: 5000})); // Set a timeout of 5 seconds for each request
        }

        try {
            // Use Promise.allSettled to handle all promises, even if some fail.
            const respones = await Promise.allSettled(batchPromises);
            // Extract the words from the responses and add them to the allWords array.
            respones.forEach(response => {
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    allWords.push(response.data[0]);
                }
            });
            console.log(`Progress: ${i + currBatchSize} / ${totalWords} words fetched.`);
        } catch (error) {
            console.error('Error fetching words:', error);
        }
    }
    return allWords;
}

app.get('/api/words', async (req, res) => {
    try {
        console.log('Starting 6000 API requests.');
        const startTime = Date.now();
        const words = await fetchWordsInBatches(6000, 5); // Fetch 6000 words in batches of 100

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