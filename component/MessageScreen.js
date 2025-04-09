import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const MessageScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const subscribeChats = (userId) => {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConversations(convs);
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (!user) {
        console.warn('No user logged in.');
        navigation.navigate('Login');
        return;
      }
      const unsubscribeChats = subscribeChats(user.uid);
      return () => unsubscribeChats();
    });
    return () => unsubscribeAuth();
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const user = auth.currentUser;
    if (user) {
      subscribeChats(user.uid);
    }
  }, []);

  const handleChatClick = (chat) => {
    const chatDetails = {
      chatId: chat.id,
      participants: chat.participants,
    };
    navigation.navigate('Chat', { chatDetails });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D47FA6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => handleChatClick(item)}>
            <View style={styles.chatInfo}>
              <Text style={styles.chatTitle}>{item.parentName || 'Chat'}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage || 'No messages yet'}
              </Text>
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={conversations.length === 0 && styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet. Start chatting!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF4E6', padding: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  chatInfo: { flex: 1 },
  chatTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  lastMessage: { fontSize: 14, color: '#666', marginTop: 4 },
  timestamp: { fontSize: 12, color: '#999' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  emptyText: { fontSize: 18, color: '#666', textAlign: 'center' },
});

export default MessageScreen;