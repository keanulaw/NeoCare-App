import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';

const feelings = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😃', label: 'Excited' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🤒', label: 'Sick' },
];

const MoodDetail = ({ route, navigation }) => {
  const { moodData } = route.params;
  const [selectedFeeling, setSelectedFeeling] = useState(moodData.mood);
  const [message, setMessage] = useState(moodData.message);

  const handleSave = async () => {
    try {
      const moodRef = doc(db, 'moods', moodData.id);
      await updateDoc(moodRef, { mood: selectedFeeling, message });
      alert('Mood updated successfully!');
      navigation.navigate('Assessment');
    } catch (error) {
      alert('Error updating mood: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>How are you feeling today?</Text>
      <Text style={styles.date}>{moodData.date}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
        {feelings.map((feeling) => (
          <TouchableOpacity
            key={feeling.label}
            style={[
              styles.emojiButton,
              selectedFeeling === feeling.label && styles.selectedEmoji,
            ]}
            onPress={() => setSelectedFeeling(feeling.label)}
          >
            <Text style={styles.emoji}>{feeling.emoji}</Text>
            <Text style={styles.emojiLabel}>{feeling.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.messageContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Edit your message..."
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
  },
  title: {
    ...commonStyles.headerText,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  date: {
    fontSize: theme.text.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emojiScroll: {
    marginBottom: theme.spacing.md,
  },
  emojiButton: {
    ...commonStyles.card,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
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
  },
  messageContainer: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  input: {
    ...commonStyles.input,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    ...commonStyles.buttonPrimary,
  },
  saveText: {
    ...commonStyles.buttonText,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
});

export default MoodDetail;
