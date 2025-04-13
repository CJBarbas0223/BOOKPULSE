import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { getCoverImageUrl } from '../services/bookService';
import { Ionicons } from '@expo/vector-icons';

const BookItem = ({ book, onPress }) => {
    const coverUrl = getCoverImageUrl(book.cover_id);

    const renderPlaceholderCover = () => (
        <View style={styles.placeholderCover}>
            <Ionicons name="book" size={40} color="#ccc" />
            <Text style={styles.placeholderTitle} numberOfLines={2}>
                {book.title}
            </Text>
            <Text style={styles.placeholderAuthor} numberOfLines={1}>
                {book.authors?.[0] || 'Unknown Author'}
            </Text>
        </View>
    );

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            {coverUrl ? (
                <Image
                    source={{ uri: coverUrl }}
                    style={styles.cover}
                    defaultSource={require('../assets/book-placeholder.png')}
                />
            ) : (
                renderPlaceholderCover()
            )}
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>
                    {book.title}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {book.authors?.[0] || 'Unknown Author'}
                </Text>
                <Text style={styles.year}>
                    {book.first_publish_year || 'Year Unknown'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 150,
        marginRight: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    cover: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    placeholderCover: {
        width: '100%',
        height: 200,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    placeholderTitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '500',
    },
    placeholderAuthor: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
        marginTop: 4,
    },
    info: {
        padding: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    author: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    year: {
        fontSize: 11,
        color: '#999',
    },
});

export default BookItem;
