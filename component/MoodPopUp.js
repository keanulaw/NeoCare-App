import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../src/theme';

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
      if (!userId) return;

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
      onSubmit(moodData);
      const lastShownDateKey = `lastMoodPopupDate_${userId}`;
      await AsyncStorage.setItem(lastShownDateKey, new Date().toISOString().split('T')[0]);
      setShowPopup(false);
    } catch (error) {
      Alert.alert('Error saving mood data: ' + error.message);
    }
  };

  return (
    <Modal
      visible={showPopup}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPopup(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>How are you feeling today?</Text>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiScroll}
          >
            {feelings.map((feeling) => (
              <TouchableOpacity
                key={feeling.label}
                style={[
                  styles.emojiButton,
                  selectedFeeling === feeling.label && styles.selectedEmoji
                ]}
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
            placeholderTextColor={theme.colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={!selectedFeeling}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: theme.colors.background,
    width: '90%',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.text.heading,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emojiScroll: {
    paddingVertical: theme.spacing.sm,
  },
  emojiButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedEmoji: {
    backgroundColor: theme.colors.secondary,
  },
  emoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  emojiLabel: {
    fontSize: theme.text.caption,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    fontSize: theme.text.body,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  submitText: {
    color: theme.colors.surface,
    fontSize: theme.text.body,
    fontWeight: 'bold',
  },
});