import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    ScrollView,
    SafeAreaView,
    Dimensions,
    Modal,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import bookService from '../services/bookService';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const BOOK_WIDTH = width * 0.25;
const categories = ['All', 'Novel', 'Science', 'Romance', 'Horror', 'Comedy'];

const PlaceholderCover = ({ title, author }) => (
    <View style={styles.placeholderCover}>
        <View style={styles.placeholderContent}>
            <Ionicons name="book-outline" size={32} color="#FF5722" />
            <Text style={styles.placeholderTitle} numberOfLines={2}>{title}</Text>
            {author && <Text style={styles.placeholderAuthor} numberOfLines={1}>{author}</Text>}
        </View>
    </View>
);

const BookItem = ({ book, onPress }) => (
    <TouchableOpacity style={styles.bookItem} onPress={onPress}>
        {book.cover_id ? (
            <Image
                source={{ uri: `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg` }}
                style={styles.coverImage}
                resizeMode="cover"
            />
        ) : (
            <PlaceholderCover 
                title={book.title}
                author={book.authors ? book.authors[0] : 'Unknown Author'}
            />
        )}
        <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
            <Text style={styles.author} numberOfLines={1}>
                {book.authors ? book.authors[0] : 'Unknown Author'}
            </Text>
            {(book.first_publish_year || book.publish_year) && (
                <Text style={styles.year}>
                    {book.first_publish_year && `First published: ${book.first_publish_year}`}
                    {book.first_publish_year && book.publish_year && '\n'}
                    {book.publish_year && book.publish_year !== book.first_publish_year && 
                        `Latest edition: ${book.publish_year}`}
                </Text>
            )}
        </View>
    </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [books, setBooks] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef(null);
    const [showScrollButtons, setShowScrollButtons] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const scrollViewRef = useRef(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Handle scroll events
    const handleScroll = (event) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        setScrollPosition(currentOffset);
        
        // Show/hide scroll buttons based on scroll position
        if (currentOffset > 200 && !showScrollButtons) {
            setShowScrollButtons(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else if (currentOffset <= 200 && showScrollButtons) {
            setShowScrollButtons(false);
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };

    // Scroll to top function
    const scrollToTop = () => {
        scrollViewRef.current?.scrollTo({
            y: 0,
            animated: true,
        });
    };

    // Scroll to bottom function
    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({
            animated: true,
        });
    };

    // Memoize filtered books by category
    const filteredBooksByCategory = useMemo(() => {
        if (selectedCategory === 'All') return books;
        return books.filter(book => 
            book.category.toLowerCase().includes(selectedCategory.toLowerCase())
        );
    }, [books, selectedCategory]);

    // Handle search with debouncing
    const handleSearch = async (query) => {
        setSearchQuery(query);
        
        // Clear any existing timeout
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // If query is empty, show recent books
        if (!query.trim()) {
            setIsSearching(false);
            fetchBooks();
            return;
        }

        // Set a new timeout for the search
        searchTimeout.current = setTimeout(async () => {
            try {
                setIsSearching(true);
                setLoading(true);
                setError(null);
                const response = await bookService.searchBooks(query);
                
                if (!response.docs) {
                    throw new Error('No results found');
                }

                const searchResults = response.docs.map(book => ({
                    id: book.key || Math.random().toString(),
                    title: book.title,
                    authors: book.author_name || ['Unknown Author'],
                    first_publish_year: book.first_publish_year,
                    publish_year: book.publish_year,
                    cover_id: book.cover_i,
                    category: book.subject_key ? 
                        book.subject_key.find(subject => 
                            categories.slice(1).some(cat => 
                                subject.toLowerCase().includes(cat.toLowerCase())
                            )
                        ) || 'Novel' 
                        : 'Novel'
                }));

                setBooks(searchResults);
                setNewArrivals([]); // Hide new arrivals during search
            } catch (err) {
                console.error('Error searching books:', err);
                setError('No results found');
                setBooks([]);
            } finally {
                setLoading(false);
            }
        }, 500); // Wait 500ms after last keystroke before searching
    };

    const fetchBooks = async () => {
        try {
            setError(null);
            setLoading(true);
            console.log('Fetching books...');
            const response = await bookService.getRecentBooks(100);
            console.log('Got response:', response);
            
            if (!response.docs) {
                throw new Error('Invalid response from API');
            }

            const booksWithCategories = response.docs.map(book => ({
                id: book.key || Math.random().toString(),
                title: book.title,
                authors: book.author_name || ['Unknown Author'],
                first_publish_year: book.first_publish_year,
                publish_year: book.publish_year,
                cover_id: book.cover_i,
                category: book.subject_key ? 
                    book.subject_key.find(subject => 
                        categories.slice(1).some(cat => 
                            subject.toLowerCase().includes(cat.toLowerCase())
                        )
                    ) || 'Novel' 
                    : 'Novel'
            }));

            // Filter new arrivals (only books from 2024-2025)
            const recentArrivals = booksWithCategories.filter(book => 
                book.first_publish_year >= 2024
            ).slice(0, 10);

            console.log('Recent arrivals:', recentArrivals.length);
            console.log('All books:', booksWithCategories.length);

            setNewArrivals(recentArrivals);
            setBooks(booksWithCategories);
        } catch (error) {
            console.error('Error fetching books:', error);
            setError(error.message || 'Failed to load books');
            setBooks([]);
            setNewArrivals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
        return () => {
            // Cleanup timeout on unmount
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, []);

    const renderBookList = (books, title) => (
        <View style={styles.section}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalBookList}
            >
                {books.length > 0 ? (
                    books.map((book) => (
                        <BookItem
                            key={book.id}
                            book={book}
                            onPress={() => navigation.navigate('BookDetails', { book })}
                        />
                    ))
                ) : (
                    <Text style={styles.emptyText}>No books found</Text>
                )}
            </ScrollView>
            <Text style={[styles.sectionTitle, styles.belowTitle]}>{title}</Text>
        </View>
    );

    const renderNewArrivals = () => renderBookList(newArrivals, 'New Arrivals');



    const handleLogout = () => {
        logout();
        navigation.replace('Login');
    };

    const renderProfileMenu = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={showProfileMenu}
            onRequestClose={() => setShowProfileMenu(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowProfileMenu(false)}
            >
                <View style={styles.profileMenu}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setShowProfileMenu(false);
                            // Add profile navigation here if needed
                        }}
                    >
                        <Ionicons name="person-outline" size={20} color="#333" />
                        <Text style={styles.menuItemText}>Profile</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.menuItem, styles.logoutItem]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                        <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>
                    Welcome back, {user?.username || 'Guest'}
                </Text>
                <Text style={styles.subtitle}>What do you want to read today?</Text>
            </View>
            <TouchableOpacity onPress={() => setShowProfileMenu(true)}>
                <View style={styles.profileImage}>
                    <Ionicons name="person" size={24} color="#666" />
                </View>
            </TouchableOpacity>
            {renderProfileMenu()}
        </View>
    );

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search books..."
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor="#999"
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
            />
        </View>
    );

    const renderCategories = () => (
        <View style={styles.categoriesWrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
                contentContainerStyle={styles.categoriesContent}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryButton,
                            selectedCategory === category && styles.selectedCategory,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                selectedCategory === category && styles.selectedCategoryText,
                            ]}
                        >
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066cc" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.error}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchBooks}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {renderHeader()}
                {renderSearchBar()}
                {renderCategories()}
                
                {/* Scroll Buttons */}
                <Animated.View style={[styles.scrollButtons, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={styles.scrollButton}
                        onPress={scrollToTop}
                    >
                        <Ionicons name="chevron-up" size={24} color="#FF5722" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.scrollButton}
                        onPress={scrollToBottom}
                    >
                        <Ionicons name="chevron-down" size={24} color="#FF5722" />
                    </TouchableOpacity>
                </Animated.View>
                
                {/* Featured Category Books - Single Row */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, styles.featuredTitle]}>
                        {selectedCategory === 'All' ? 'Featured Books' : `${selectedCategory} Books`}
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalBookList}
                    >
                        {loading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : filteredBooksByCategory.length > 0 ? (
                            filteredBooksByCategory.map((book) => (
                                <BookItem
                                    key={book.id}
                                    book={book}
                                    onPress={() => navigation.navigate('BookDetails', { book })}
                                />
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No books found in this category</Text>
                        )}
                    </ScrollView>
                </View>

                {/* New Books Section */}
                <View style={[styles.section, styles.newSection]}>
                    <Text style={[styles.sectionTitle, styles.newTitle]}>New</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalBookList}
                    >
                        {loading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : newArrivals.length > 0 ? (
                            newArrivals.map((book) => (
                                <BookItem
                                    key={book.id}
                                    book={book}
                                    onPress={() => navigation.navigate('BookDetails', { book })}
                                />
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No new books available</Text>
                        )}
                    </ScrollView>
                </View>
            </ScrollView>
            {showScrollButtons && (
                <View style={styles.scrollButtons}>
                    <TouchableOpacity
                        style={styles.scrollButton}
                        onPress={scrollToTop}
                    >
                        <Ionicons name="arrow-up" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.scrollButton}
                        onPress={scrollToBottom}
                    >
                        <Ionicons name="arrow-down" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    placeholderCover: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFE4D6',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        padding: 8,
    },
    placeholderContent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    placeholderTitle: {
        color: '#1a1a1a',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    placeholderAuthor: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
    },
    bookItem: {
        width: BOOK_WIDTH,
        marginHorizontal: 8,
        marginBottom: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        overflow: 'hidden',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    scrollButtons: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: 'white',
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        padding: 8,
        zIndex: 1000,
    },
    scrollButton: {
        padding: 8,
        backgroundColor: '#FFE4D6',
        borderRadius: 20,
        marginVertical: 4,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    welcomeContainer: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    },
    categoriesWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginTop: 16,
    },
    categoriesContainer: {
        height: 44,
    },
    categoriesContent: {
        paddingHorizontal: 16,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    selectedCategory: {
        borderBottomColor: '#0066cc',
    },
    categoryText: {
        fontSize: 16,
        color: '#666',
    },
    selectedCategoryText: {
        color: '#0066cc',
        fontWeight: '600',
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginHorizontal: 16,
        color: '#333',
    },
    belowTitle: {
        marginTop: 12,
    },
    featuredTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    horizontalBookList: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    bookItem: {
        width: BOOK_WIDTH,
        marginRight: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    coverImage: {
        width: '100%',
        height: BOOK_WIDTH * 1.5,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    bookInfo: {
        padding: 6,
    },
    bookTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    author: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    year: {
        fontSize: 9,
        color: '#999',
    },
    placeholderCover: {
        width: '100%',
        height: BOOK_WIDTH * 1.5,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    placeholderText: {
        color: '#666',
        fontSize: 12,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    error: {
        color: 'red',
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        paddingVertical: 20,
    },
    scrollButtons: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        alignItems: 'center',
    },
    scrollButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0066cc',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        marginBottom: 8,
    },
    newSection: {
        marginTop: 24,
    },
    newTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    profileMenu: {
        position: 'absolute',
        top: 60,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 8,
        minWidth: 150,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 6,
    },
    menuItemText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
    logoutItem: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 4,
    },
    logoutText: {
        color: '#FF3B30',
    },
});

export default HomeScreen;
