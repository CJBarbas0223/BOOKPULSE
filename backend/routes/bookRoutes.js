const express = require('express');
const router = express.Router();
const openLibraryService = require('../services/openLibraryService');

// Search books
router.get('/search', async (req, res) => {
    try {
        const { query, page = 1, limit = 20 } = req.query;
        if (!query) {
            return res.status(400).json({ 
                success: false,
                error: 'Query parameter is required'
            });
        }
        
        const results = await openLibraryService.searchBooks(query, parseInt(page), parseInt(limit));
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to search books',
            message: error.message
        });
    }
});

// Get recent books
router.get('/recent', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        console.log('Fetching recent books with limit:', limit);
        
        const results = await openLibraryService.getRecentBooks(parseInt(limit));
        console.log(`Successfully fetched ${results.docs.length} books`);
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Recent books error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch recent books',
            message: error.message
        });
    }
});

// Get book details
router.get('/details/:olid', async (req, res) => {
    try {
        const { olid } = req.params;
        const book = await openLibraryService.getBookDetails(olid);
        res.json({
            success: true,
            data: book
        });
    } catch (error) {
        console.error('Book details error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch book details',
            message: error.message
        });
    }
});

module.exports = router;
