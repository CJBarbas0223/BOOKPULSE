import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import bookService from '../services/bookService';

const PlaceholderCover = ({ title, author }) => (
    <View style={styles.placeholderCover}>
        <View style={styles.placeholderContent}>
            <Ionicons name="book-outline" size={64} color="#FF5722" />
            <Text style={styles.placeholderTitle} numberOfLines={3}>{title}</Text>
            {author && <Text style={styles.placeholderAuthor} numberOfLines={2}>{author}</Text>}
        </View>
    </View>
);

const BookDetailsScreen = ({ route, navigation }) => {
    const { book } = route.params;
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookDetails = async () => {
            try {
                if (book.key) {
                    const olid = book.key.split('/').pop();
                    const bookDetails = await bookService.getBookDetails(olid);
                    console.log('Book details:', bookDetails); // For debugging
                    setDetails(bookDetails);
                }
            } catch (error) {
                console.error('Error fetching book details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookDetails();
    }, [book]);

    useEffect(() => {
        // Set the navigation header title
        navigation.setOptions({
            title: book.title || 'Book Details'
        });
    }, [navigation, book]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const coverUrl = book.cover_id 
        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`
        : null;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.coverContainer}>
                    {coverUrl ? (
                        <Image
                            source={{ uri: coverUrl }}
                            style={styles.coverImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <PlaceholderCover 
                            title={book.title}
                            author={book.author_name ? book.author_name[0] : 'Unknown Author'}
                        />
                    )}
                </View>
                
                <View style={styles.infoContainer}>
                    <Text style={styles.title}>{book.title}</Text>
                    
                    <View style={styles.authorDateContainer}>
                        {(book.author_name || (details?.authors && details.authors.length > 0)) && (
                            <Text style={styles.author}>
                                By {book.author_name ? book.author_name.join(', ') : 
                                    details.authors.map(author => 
                                        typeof author === 'object' ? author.name : author
                                    ).join(', ')}
                            </Text>
                        )}

                        {(book.first_publish_year || book.publish_year || details?.first_publish_date || details?.publish_date) && (
                            <View style={styles.dateContainer}>
                                {book.first_publish_year && (
                                    <Text style={styles.publishYear}>
                                        First published: {book.first_publish_year}
                                    </Text>
                                )}
                                {(book.publish_year || details?.publish_date) && 
                                 (book.publish_year !== book.first_publish_year) && (
                                    <Text style={styles.publishYear}>
                                        Latest edition: {book.publish_year || details.publish_date}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>

                    {details?.description && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.description}>
                                {typeof details.description === 'object' 
                                    ? details.description.value 
                                    : typeof details.description === 'string'
                                        ? details.description
                                        : 'No description available.'}
                            </Text>
                        </View>
                    )}

                    {(book.subject || details?.subjects) && (
                        <View style={styles.subjectsContainer}>
                            <Text style={styles.sectionTitle}>Genres</Text>
                            <View style={styles.subjectTags}>
                                {(book.subject || details.subjects || []).slice(0, 5).map((subject, index) => (
                                    <View key={index} style={styles.subjectTag}>
                                        <Text style={styles.subjectTagText}>{subject}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    placeholderCover: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFE4D6',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
    },
    placeholderContent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    placeholderTitle: {
        color: '#1a1a1a',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    placeholderAuthor: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
    dateContainer: {
        marginTop: 8,
    },
    coverContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1a1a1a',
    },
    authorDateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    author: {
        fontSize: 18,
        color: '#4a4a4a',
        flex: 1,
    },
    publishYear: {
        fontSize: 16,
        color: '#666',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    descriptionContainer: {
        marginTop: 16,
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
        color: '#333',
        marginBottom: 24,
        textAlign: 'justify',
    },
    subjectsContainer: {
        marginTop: 8,
    },
    subjectTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    subjectTag: {
        backgroundColor: '#FFE4D6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    subjectTagText: {
        color: '#FF5722',
        fontSize: 14,
    },
    placeholderCover: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        fontSize: 18,
    },
});

export default BookDetailsScreen;
