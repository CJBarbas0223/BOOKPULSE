const axios = require('axios');

const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';

class OpenLibraryService {
    constructor() {
        this.api = axios.create({
            baseURL: OPEN_LIBRARY_BASE_URL,
            timeout: 15000, // Increased timeout
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    async retryRequest(fn, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    /**
     * Search for books by title, author, or ISBN
     * @param {string} query - Search query
     * @param {number} page - Page number (1-based)
     * @param {number} limit - Number of results per page
     * @returns {Promise} Search results
     */
    async searchBooks(query, page = 1, limit = 10) {
        try {
            console.log('Searching books with query:', query);
            const response = await this.api.get('/search.json', {
                params: {
                    q: query,
                    page,
                    limit,
                    fields: 'key,title,author_name,cover_i,first_publish_year,subject'
                }
            });
            console.log('Search response received:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error in searchBooks:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Get recently added books
     * @param {number} limit - Number of results to return
     * @returns {Promise} List of recent books
     */
    async getRecentBooks(limit = 10) {
        return this.retryRequest(async () => {
            try {
                console.log('Fetching recent books with limit:', limit);
                const response = await this.api.get('/search.json', {
                    params: {
                        q: 'first_publish_year:[2020 TO 2025]',
                        sort: 'new',
                        limit,
                        fields: 'key,title,author_name,cover_i,first_publish_year,subject'
                    }
                });
                
                if (!response.data || !Array.isArray(response.data.docs)) {
                    console.error('Invalid response format:', response.data);
                    throw new Error('Invalid response format from Open Library API');
                }

                console.log(`Found ${response.data.docs.length} recent books`);
                
                // Transform and validate the response
                const books = response.data.docs
                    .filter(book => book.title && (book.cover_i || book.author_name))
                    .map(book => ({
                        id: book.key.split('/').pop(),
                        title: book.title,
                        authors: book.author_name || ['Unknown Author'],
                        cover_id: book.cover_i,
                        year: book.first_publish_year,
                        subjects: book.subject || []
                    }));
                
                return { 
                    docs: books, 
                    numFound: books.length,
                    total: response.data.numFound 
                };
            } catch (error) {
                console.error('Error in getRecentBooks:', error.message);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                }
                throw error;
            }
        });
    }

    /**
     * Get detailed information about a book by its Open Library ID
     * @param {string} olid - Open Library ID
     * @returns {Promise} Book details
     */
    async getBookDetails(olid) {
        try {
            console.log('Fetching book details for:', olid);
            const response = await this.api.get(`/works/${olid}.json`);
            console.log('Book details received');
            return response.data;
        } catch (error) {
            console.error('Error in getBookDetails:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Get book cover image URL
     * @param {string} coverId - Cover ID from Open Library
     * @param {string} size - Size of the cover image ('S', 'M', or 'L')
     * @returns {string} Cover image URL
     */
    getCoverImageUrl(coverId, size = 'M') {
        if (!coverId) return null;
        return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
    }
}

module.exports = new OpenLibraryService();
