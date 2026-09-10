const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:3000';

export async function fetchWords() {
    const response = await fetch(`${API_URL}/api/words`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch words: ${response.status}`);
    }

    return response.json();
}