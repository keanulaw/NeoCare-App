import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
    flex: 1,
    backgroundColor: '#FFF4E6',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D47FA6',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#A9A9A9',
    textAlign: 'center',
    marginBottom: 20,
  },
  emojiScroll: {
    marginBottom: 20,
  },
  emojiButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginHorizontal: 8,
    width: 80,
    height: 80,
    elevation: 3,
  },
  selectedEmoji: {
    backgroundColor: '#FF6F61',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  emojiLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  messageContainer: {
    flex: 1,
    marginTop: -200,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#FF6F61',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MoodDetail;
