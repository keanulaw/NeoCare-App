import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from "react-native";
import { GiftedChat, Bubble, Send, InputToolbar } from "react-native-gifted-chat";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import Icon from 'react-native-vector-icons/Ionicons'; // Make sure to install this package

const ChatScreen = ({ route }) => {
  const { consultant } = route.params;
  const user = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch or create chat document
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const participants = [user.uid, consultant.id].sort();
        console.log("RN Participants:", participants);

        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "==", participants));
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          console.log("RN Existing Chat ID:", snapshot.docs[0].id);
          setChatId(snapshot.docs[0].id);
        } else {
          const newChatRef = doc(chatsRef);
          await setDoc(newChatRef, {
            participants,
            parentUid: user.uid,
            doctorUid: consultant.userId,
            createdAt: new Date(),
          });
          console.log("RN New Chat ID:", newChatRef.id);
          setChatId(newChatRef.id);
        }
      } catch (error) {
        console.error("RN Chat Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.uid && consultant?.id) {
      fetchChat();
    }
  }, [user?.uid, consultant?.id]);

  // Fetch messages for the current chat
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Handle sending messages
  const onSend = useCallback(
    async (messages = []) => {
      try {
        if (!chatId) {
          console.log("RN Chat ID not found!");
          return;
        }

        await addDoc(collection(db, "chats", chatId, "messages"), {
          text: messages[0].text,
          user: messages[0].user,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error("RN Send Error:", error);
      }
    },
    [chatId]
  );

  // Custom bubble component
  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#D47FA6', // Pink color for sent messages
          },
          left: {
            backgroundColor: '#F0F0F0', // Light gray for received messages
          },
        }}
        textStyle={{
          right: {
            color: '#FFFFFF',
          },
          left: {
            color: '#000000',
          },
        }}
      />
    );
  };

  // Enhanced custom send button
  const renderSend = (props) => {
    return (
      <Send {...props} containerStyle={styles.sendContainer}>
        <View style={styles.sendButton}>
          <Icon 
            name="paper-plane" 
            size={20} 
            color="#FFFFFF"
          />
        </View>
      </Send>
    );
  };

  // Custom input toolbar
  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        textInputStyle={styles.textInput}
      />
    );
  };

  // Loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D47FA6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{ _id: user?.uid }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderInputToolbar={renderInputToolbar}
        alwaysShowSend
        scrollToBottom
        renderAvatar={null}
        timeTextStyle={{
          right: { color: '#FFF' },
          left: { color: '#666' }
        }}
        placeholder="Type your message here..."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6', // Light pink background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  sendButton: {
    backgroundColor: '#D47FA6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    paddingTop: 5,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textInput: {
    color: '#333333',
    fontSize: 16,
    lineHeight: 20,
    marginLeft: 5,
  },
});

export default ChatScreen;