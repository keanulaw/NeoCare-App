import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth'; // Import Firebase auth from JS SDK

const feelings = {
  Happy: '😊',
  Sad: '😢',
  Angry: '😡',
  Tired: '😴',
  Excited: '😃',
  Neutral: '😐',
  Sick: '🤒',
};

const AssessmentScreen = ({ navigation }) => {
  const [moodEntries, setMoodEntries] = useState([]);
  const auth = getAuth(); // Initialize Firebase Auth
  const userId = auth.currentUser?.uid; // Get the current user's ID

  useEffect(() => {
    if (!userId) {
      console.error('User ID is undefined');
      return;
    }

    const fetchMoodEntries = async () => {
      try {
        const q = query(collection(db, 'moods'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const entries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort entries by date in descending order
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        setMoodEntries(entries);
      } catch (error) {
        console.error('Error fetching mood entries: ', error);
      }
    };

    fetchMoodEntries();
  }, [userId]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.entryContainer}
      onPress={() => navigation.navigate('MoodDetail', { moodData: item })}
    >
      <View style={styles.dateContainer}>
        <Text style={styles.date}>{format(new Date(item.date), 'MMM')}</Text>
        <Text style={styles.day}>{format(new Date(item.date), 'd')}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.moodText}>You feel {item.mood}</Text>
        <Text style={styles.emoji}>{feelings[item.mood]}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assessment</Text>
      <FlatList
        data={moodEntries}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  day: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  emoji: {
    fontSize: 24,
  },
});

export default AssessmentScreen;
