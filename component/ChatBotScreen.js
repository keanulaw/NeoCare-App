import React, { useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { GiftedChat, Bubble, Send } from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../src/theme';           // Your theme file (if available)
import commonStyles from '../src/commonStyles'; // Your commonStyles file (if available)
import CustomHeader from './CustomHeader'; // Import the CustomHeader

const ChatBotScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  // Handle sending a message
  const onSend = useCallback(async (newMessages = []) => {
    // Append user's message
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    const userMessage = newMessages[0].text.trim();
    if (!userMessage) return;

    // Show typing indicator message
    const typingMessage = {
      _id: Math.round(Math.random() * 1000000),
      text: 'ChatBot is typing...',
      createdAt: new Date(),
      user: { _id: 2, name: 'ChatBot' },
      system: true
    };
    setMessages(previousMessages => GiftedChat.append(previousMessages, typingMessage));
    setIsLoadingResponse(true);

    try {
      const response = await fetch('http://192.168.1.11:3000/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: userMessage })
      });
      const data = await response.json();

      // Remove the typing indicator before adding the reply
      setMessages(previousMessages =>
        previousMessages.filter(msg => !msg.system)
      );

      const botReply = {
        _id: Math.round(Math.random() * 1000000),
        text: data.recommendation || "I'm sorry, I couldn't generate a recommendation.",
        createdAt: new Date(),
        user: { _id: 2, name: 'ChatBot' }
      };
      setMessages(previousMessages => GiftedChat.append(previousMessages, botReply));
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      // Remove the typing indicator on error
      setMessages(previousMessages =>
        previousMessages.filter(msg => !msg.system)
      );
      const errorReply = {
        _id: Math.round(Math.random() * 1000000),
        text: "Oops! Something went wrong. Please try again later.",
        createdAt: new Date(),
        user: { _id: 2, name: 'ChatBot' }
      };
      setMessages(previousMessages => GiftedChat.append(previousMessages, errorReply));
    } finally {
      setIsLoadingResponse(false);
    }
  }, []);

  // Customize chat bubble style
  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: theme.colors.primary || '#D47FA6' },
        left: { backgroundColor: '#F0F0F0' },
      }}
      textStyle={{
        right: { color: '#fff' },
        left: { color: '#333' },
      }}
    />
  );

  // Customize send button
  const renderSend = (props) => (
    <Send {...props} containerStyle={styles.sendContainer}>
      <Icon name="send" size={24} color="#fff" />
    </Send>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Chat Bot" navigation={navigation} />
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{ _id: 1 }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        placeholder="Type your symptoms..."
      />
      {isLoadingResponse && (
        <ActivityIndicator
          style={styles.loadingIndicator}
          size="large"
          color={theme.colors.primary || '#D47FA6'}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
});

export default ChatBotScreen;
