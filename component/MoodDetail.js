import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';
import CustomHeader from './CustomHeader';

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
    <SafeAreaView style={commonStyles.screenContainer}>
      <CustomHeader title="Mood Detail" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>How are you feeling today?</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.emojiScroll}
          contentContainerStyle={styles.emojiContentContainer}
        >
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

        <TextInput
          style={styles.input}
          placeholder="Share your thoughts..."
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save Mood</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: theme.spacing.md,
  },
  title: {
    ...commonStyles.headerText,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
    fontSize: 24,
  },
  emojiScroll: {
    marginBottom: theme.spacing.lg,
  },
  emojiContentContainer: {
    paddingHorizontal: theme.spacing.sm,
  },
  emojiButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  selectedEmoji: {
    backgroundColor: theme.colors.secondary,
  },
  emoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  emojiLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  input: {
    ...commonStyles.input,
    minHeight: 120,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.sm,
    borderRadius: 8,
    textAlignVertical: 'top',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    ...commonStyles.buttonPrimary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  saveText: {
    ...commonStyles.buttonText,
    fontSize: 18,
  },
});

export default MoodDetail;
