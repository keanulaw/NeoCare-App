import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const MessageScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.warn("No user logged in.");
        navigation.navigate('Login');
        return;
      }

      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeChats = onSnapshot(q, (snapshot) => {
        const convs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConversations(convs);
        setLoading(false);
      });

      return () => unsubscribeChats();
    });

    return () => unsubscribe();
  }, [navigation]);

  const handleChatClick = (chat) => {
    const chatDetails = {
      chatId: chat.id,
      participants: chat.participants,
      // Add any other necessary details from the chat object
    };
    navigation.navigate('Chat', { chatDetails });
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
      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => handleChatClick(item)}
            >
              <View style={styles.chatInfo}>
                <Text style={styles.chatTitle}>{item.parentName || "Chat"}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage || "No messages yet"}
                </Text>
              </View>
              <Text style={styles.timestamp}>
                {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString() : ""}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet. Start chatting!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF4E6', padding: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  listContainer: { flexGrow: 1, paddingBottom: 20 },
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#666' },
});

export default MessageScreen;