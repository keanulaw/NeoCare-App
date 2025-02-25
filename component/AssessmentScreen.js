import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

const moodEmojis = {
  Happy: '😊',
  Sad: '😢',
  Angry: '😡',
  Tired: '😴',
  Excited: '😃',
  Neutral: '😐',
  Sick: '🤒',
};

const AssessmentScreen = ({ navigation }) => {
  const [moods, setMoods] = useState({});
  const [monthlyAverage, setMonthlyAverage] = useState({});
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      console.error('User ID is undefined');
      return;
    }

    const fetchMoods = async () => {
      try {
        const moodCollection = collection(db, 'moods');
        const moodSnapshot = await getDocs(moodCollection);
        const moodData = {};

        moodSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.userId === userId) {
            const date = data.date; // Assuming date is stored in 'YYYY-MM-DD' format
            moodData[date] = { id: doc.id, mood: data.mood, message: data.message };
          }
        });

        setMoods(moodData);
        calculateMonthlyAverage(moodData);
      } catch (error) {
        console.error('Error fetching moods: ', error);
      }
    };

    fetchMoods();
  }, [userId]);

  const calculateMonthlyAverage = (moodData) => {
    const monthlyData = {};

    Object.keys(moodData).forEach(date => {
      const month = date.slice(0, 7); // Extract 'YYYY-MM' from 'YYYY-MM-DD'
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, count: 0 };
      }
      // Assuming mood is a numeric value for simplicity
      monthlyData[month].total += moodData[date].mood;
      monthlyData[month].count += 1;
    });

    const averages = {};
    Object.keys(monthlyData).forEach(month => {
      averages[month] = (monthlyData[month].total / monthlyData[month].count).toFixed(2);
    });

    setMonthlyAverage(averages);
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={Object.keys(moods).reduce((acc, date) => {
          const mood = moods[date].mood;
          acc[date] = { marked: true, dotColor: '#D47FA6', customStyles: { text: { text: moodEmojis[mood] || '' } } };
          return acc;
        }, {})}
        onDayPress={(day) => {
          const selectedMood = moods[day.dateString];
          if (selectedMood) {
            navigation.navigate('MoodDetail', { moodData: selectedMood });
          }
        }}
      />
      <ScrollView style={styles.averageContainer}>
        {Object.keys(monthlyAverage).map(month => (
          <Text key={month} style={styles.averageText}>
            {month}: Average Mood - {monthlyAverage[month]}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
    padding: 20,
  },
  averageContainer: {
    marginTop: 20,
  },
  averageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
});

export default AssessmentScreen;
