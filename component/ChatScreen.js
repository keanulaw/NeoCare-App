import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

const ChatScreen = ({ route }) => {
  const { consultant } = route.params;
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', consultant.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesFirestore = snapshot.docs.map((doc) => {
        const message = doc.data();
        return {
          ...message,
          createdAt: message.createdAt.toDate(),
        };
      });
      setMessages(messagesFirestore);
    });

    return () => unsubscribe();
  }, [consultant.id]);

  const onSend = useCallback((messages = []) => {
    const { _id, createdAt, text, user } = messages[0];
    addDoc(collection(db, 'chats', consultant.id, 'messages'), {
      _id,
      createdAt,
      text,
      user,
    });
  }, [consultant.id]);

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{
        _id: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'User',
        avatar: auth.currentUser.photoURL || 'default_avatar_url',
      }}
      renderBubble={(props) => (
        <Bubble
          {...props}
          wrapperStyle={{
            right: { backgroundColor: '#FF6F61' },
            left: { backgroundColor: '#FFF' },
          }}
        />
      )}
      renderInputToolbar={(props) => (
        <InputToolbar
          {...props}
          containerStyle={{
            borderTopWidth: 1,
            borderTopColor: '#E8E8E8',
            backgroundColor: '#FFF4E6',
          }}
        />
      )}
    />
  );
};

export default ChatScreen;