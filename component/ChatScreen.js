import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Text, FlatList } from "react-native";
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
  serverTimestamp,
} from "firebase/firestore";
import Icon from 'react-native-vector-icons/Ionicons'; // Make sure to install this package
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';
import CustomHeader from './CustomHeader'; // Import the CustomHeader

const ChatScreen = ({ route, navigation }) => {
  const { chatDetails } = route.params;
  const user = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chatDetails || !chatDetails.chatId) {
      console.error("No chatId provided to ChatScreen");
      return;
    }

    console.log("Fetching messages for chatId:", chatDetails.chatId);
    // Use the subcollection "messages" under the specific chat document
    const messagesRef = collection(db, "chats", chatDetails.chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setMessages(messagesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatDetails]);

  // Handle sending messages
  const onSend = useCallback(
    async (messages = []) => {
      try {
        if (!chatDetails || !chatDetails.chatId) {
          console.log("RN Chat ID not found!");
          return;
        }

        await addDoc(collection(db, "chats", chatDetails.chatId, "messages"), {
          text: messages[0].text,
          user: messages[0].user,
          createdAt: serverTimestamp(),
          status: 'sent',
        });
      } catch (error) {
        console.error("RN Send Error:", error);
      }
    },
    [chatDetails]
  );

  // Updated navigation handler with error handling and logging
  const handleMakeAppointment = () => {
    navigation.navigate('AppointmentScreen', { consultant: chatDetails.consultant });
  };

  // Custom bubble component
  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: '#D47FA6' },
          left: { backgroundColor: '#F0F0F0' },
        }}
        textStyle={{
          right: { color: '#FFFFFF' },
          left: { color: '#000000' },
        }}
      />
    );
  };

  // Enhanced custom send button
  const renderSend = (props) => {
    return (
      <Send {...props} containerStyle={styles.sendContainer}>
        <View style={styles.sendButton}>
          <Icon name="paper-plane" size={20} color="#FFFFFF" />
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

  // Render status in Bubble
  const renderCustomView = (props) => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusText}>
        {props.currentMessage.status === 'sent' && '✓'}
        {props.currentMessage.status === 'delivered' && '✓✓'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Chat" navigation={navigation} />
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <>
          {/* Make Appointment Button */}
          <TouchableOpacity style={styles.appointmentButton} onPress={handleMakeAppointment}>
            <Text style={styles.appointmentText}>Make Appointment</Text>
          </TouchableOpacity>

          <GiftedChat
            messages={messages}
            onSend={(messages) => onSend(messages)}
            user={{ _id: user?.uid }}
            renderBubble={renderBubble}
            renderSend={renderSend}
            renderInputToolbar={renderInputToolbar}
            alwaysShowSend
            scrollToBottom
            renderAvatar={null}
            timeTextStyle={{
              right: { color: '#FFF' },
              left: { color: '#666' },
            }}
            placeholder="Type your message here..."
            renderCustomView={renderCustomView}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
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
  appointmentButton: {
    ...commonStyles.buttonPrimary,
  },
  appointmentText: {
    ...commonStyles.buttonText,
  },
  statusContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FFFFFF',
    padding: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ChatScreen;