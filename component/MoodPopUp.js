import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const feelings = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😃', label: 'Excited' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🤒', label: 'Sick' },
];

export default function MoodPopup({ onSubmit, userId }) {
  const [selectedFeeling, setSelectedFeeling] = useState('');
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const checkIfPopupShouldShow = async () => {
      if (!userId) return; // Ensure userId is available

      const lastShownDateKey = `lastMoodPopupDate_${userId}`;
      const lastShownDate = await AsyncStorage.getItem(lastShownDateKey);
      const today = new Date().toISOString().split('T')[0];

      if (lastShownDate !== today) {
        setShowPopup(true);
      }
    };

    checkIfPopupShouldShow();
  }, [userId]);

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('User ID is missing');
      return;
    }

    const moodData = {
      userId,
      mood: selectedFeeling,
      message: message,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      await addDoc(collection(db, 'moods'), moodData);
      Alert.alert('Mood data saved successfully!');
      onSubmit(moodData);
      const lastShownDateKey = `lastMoodPopupDate_${userId}`;
      await AsyncStorage.setItem(lastShownDateKey, new Date().toISOString().split('T')[0]);
      setShowPopup(false);
    } catch (error) {
      Alert.alert('Error saving mood data: ' + error.message);
    }
  };

  if (!showPopup) {
    return null; // Don't render anything if the popup shouldn't be shown
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {feelings.map((feeling) => (
          <TouchableOpacity
            key={feeling.label}
            style={[styles.emojiButton, selectedFeeling === feeling.label && styles.selectedEmoji]}
            onPress={() => setSelectedFeeling(feeling.label)}
          >
            <Text style={styles.emoji}>{feeling.emoji}</Text>
            <Text style={styles.emojiLabel}>{feeling.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TextInput
        style={styles.input}
        placeholder="Type your message here..."
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  emojiButton: {
    alignItems: 'center',
    marginHorizontal: 10,
    padding: 10,
  },
  selectedEmoji: {
    backgroundColor: '#D47FA6',
    borderRadius: 10,
  },
  emoji: {
    fontSize: 40,
  },
  emojiLabel: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    marginVertical: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#D47FA6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});