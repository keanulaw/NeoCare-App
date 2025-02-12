import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import MoodPopup from './MoodPopUp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';

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
        <ActivityIndicator size="large" color="#D47FA6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>NEOCARE</Text>
      <Text style={styles.subtitle}>TENDER CARE FOR TWO</Text>

      <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStartedPress}>
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.emergencyButton}>
        <Text style={styles.buttonText}>EMERGENCY BUTTON</Text>
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
    flex: 1,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    color: '#D47FA6',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#A9A9A9',
    marginBottom: 40,
  },
  getStartedButton: {
    backgroundColor: '#F8BBD0',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
  },
  emergencyButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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