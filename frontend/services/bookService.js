import axios from 'axios';

const OPEN_LIBRARY_API = 'https://openlibrary.org';

// Create axios instance with timeout and headers
const api = axios.create({
    baseURL: OPEN_LIBRARY_API,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const bookService = {
    // Fetch recent books
    getRecentBooks: async (limit = 100) => {
        try {
            const currentYear = new Date().getFullYear();
            const response = await api.get('/search.json', {
                params: {
                    q: `publish_year:[${currentYear - 1} TO ${currentYear + 1}]`,
                    fields: 'key,title,author_name,first_publish_year,publish_year,cover_i,subject_key',
                    limit: limit,
                    sort: 'new'
                }
            });

            if (!response.data || !response.data.docs) {
                throw new Error('Invalid response from Open Library API');
            }

            return response.data;
        } catch (error) {
            console.error('Error fetching books:', error);
            throw error;
        }
    },

    // Search books
    searchBooks: async (query, limit = 20) => {
        try {
            const response = await api.get('/search.json', {
                params: {
                    q: query,
                    fields: 'key,title,author_name,first_publish_year,publish_year,cover_i,subject_key',
                    limit: limit
                }
            });

            if (!response.data || !response.data.docs) {
                throw new Error('Invalid response from Open Library API');
            }

            return response.data;
        } catch (error) {
            console.error('Error searching books:', error);
            throw error;
        }
    },

    // Get book details
    getBookDetails: async (bookId) => {
        try {
            // Get the work details
            const workResponse = await api.get(`/works/${bookId}.json`);

            if (!workResponse.data) {
                throw new Error('Invalid response from Open Library API');
            }

            // Get the edition details if available
            let editionDetails = {};
            if (workResponse.data.first_publish_date) {
                try {
                    const editionResponse = await api.get(`/works/${bookId}/editions.json?limit=1&sort=publish_date`);
                    if (editionResponse.data && editionResponse.data.entries && editionResponse.data.entries.length > 0) {
                        editionDetails = editionResponse.data.entries[0];
                    }
                } catch (editionError) {
                    console.warn('Could not fetch edition details:', editionError);
                }
            }

            // Combine work and edition details
            return {
                ...workResponse.data,
                ...editionDetails,
                description: workResponse.data.description || editionDetails.description || 'No description available.',
                authors: workResponse.data.authors || editionDetails.authors || [],
                subjects: workResponse.data.subjects || editionDetails.subjects || [],
                first_publish_date: workResponse.data.first_publish_date || editionDetails.publish_date,
            };
        } catch (error) {
            console.error('Error fetching book details:', error);
            throw error;
        }
    },

    // Get book cover image URL
    getCoverImageUrl: (coverId, size = 'M') => {
        if (!coverId) return null;
        
        // Try to get a larger cover if available
        const sizes = {
            'S': 'S', // Small: 180px
            'M': 'M', // Medium: 360px
            'L': 'L'  // Large: 720px
        };

        const imageSize = sizes[size] || 'M';

        // First try the newer cover ID format
        const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-${imageSize}.jpg`;

        // Add a timestamp to prevent caching issues
        return `${coverUrl}?t=${Date.now()}`;
    }
};

export default bookService;
