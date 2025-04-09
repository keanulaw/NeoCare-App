import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import MoodPopup from './MoodPopUp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';

export default function GetStarted({ navigation }) {
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [moodData, setMoodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleGetStartedPress = async () => {
    if (!userId) {
      alert('User ID is missing');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const lastShownDateKey = `lastMoodPopupDate_${userId}`;
    const lastShownDate = await AsyncStorage.getItem(lastShownDateKey);

    if (lastShownDate !== today) {
      setShowMoodPopup(true);
    } else {
      navigation.navigate('HomeTabs');
    }
  };

  const handleMoodSubmit = async (data) => {
    setMoodData(data);
    setShowMoodPopup(false);
    const lastShownDateKey = `lastMoodPopupDate_${userId}`;
    await AsyncStorage.setItem(lastShownDateKey, new Date().toISOString().split('T')[0]);
    navigation.navigate('HomeTabs', { moodData: data });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>NEOCARE</Text>
      <Text style={styles.subtitle}>TENDER CARE FOR TWO</Text>

      <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStartedPress}>
        <Text style={styles.getStartedText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.emergencyButton}>
        <Text style={styles.buttonText}>EMERGENCY BUTTON</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.chatbotButton} onPress={() => navigation.navigate('ChatBot')}>
        <Text style={styles.chatbotButtonText}>Chat with Bot</Text>
      </TouchableOpacity>

      <Modal
        visible={showMoodPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoodPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MoodPopup onSubmit={handleMoodSubmit} userId={userId} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    color: '#D47FA6',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#A9A9A9',
    marginBottom: 40,
  },
  getStartedButton: {
    backgroundColor: theme.colors.primary || '#D47FA6',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
    elevation: 5,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emergencyButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatbotButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
    elevation: 5,
  },
  chatbotButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '85%',
  },
});