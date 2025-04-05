import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';

const moodEmojis = {
  Happy: '😊',
  Sad: '😢',
  Angry: '😡',
  Tired: '😴',
  Excited: '😃',
  Neutral: '😐',
  Sick: '🤒',
};

// Helper function to generate unique document ID combining userId and date
const generateMoodDocId = (userId, date) => `${userId}_${date}`;

const AssessmentScreen = ({ navigation }) => {
  const [moods, setMoods] = useState({});
  const [monthlyAverage, setMonthlyAverage] = useState({});
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      console.error('User ID is undefined');
      return;
    }

    const fetchMoods = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'moods'),
          where('userId', '==', userId)
        );
        const moodSnapshot = await getDocs(q);
        const moodData = {};

        moodSnapshot.forEach(doc => {
          const data = doc.data();
          const date = data.date;
          
          // Ensure only one mood entry per date
          if (!moodData[date] || doc.id === generateMoodDocId(userId, date)) {
            moodData[date] = { 
              id: doc.id, 
              mood: data.mood, 
              message: data.message,
              userId: data.userId,
              date: data.date
            };
          }
        });

        setMoods(moodData);
        calculateMonthlyAverage(moodData);
      } catch (error) {
        console.error('Error fetching moods: ', error);
        Alert.alert("Error", "Failed to load mood data");
      } finally {
        setLoading(false);
      }
    };

    fetchMoods();
  }, [userId]);

  const calculateMonthlyAverage = (moodData) => {
    const monthlyData = {};
    const moodValues = {
      Happy: 5,
      Excited: 4,
      Neutral: 3,
      Tired: 2,
      Sad: 1,
      Angry: 0,
      Sick: -1
    };

    Object.keys(moodData).forEach(date => {
      const month = date.slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, count: 0 };
      }
      // Convert mood to numeric value for calculation
      monthlyData[month].total += moodValues[moodData[date].mood] || 0;
      monthlyData[month].count += 1;
    });

    const averages = {};
    Object.keys(monthlyData).forEach(month => {
      const avg = monthlyData[month].total / monthlyData[month].count;
      averages[month] = avg.toFixed(2);
    });

    setMonthlyAverage(averages);
  };

  const getMoodColor = (avg) => {
    const value = parseFloat(avg);
    if (value >= 4) return '#4CAF50'; // Happy/Excited - Green
    if (value >= 2.5) return '#FFC107'; // Neutral - Yellow
    if (value >= 1) return '#FF9800'; // Tired - Orange
    return '#F44336'; // Sad/Angry/Sick - Red
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mood Assessment</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <>
          <Calendar
            markedDates={Object.keys(moods).reduce((acc, date) => {
              const mood = moods[date].mood;
              acc[date] = { 
                marked: true, 
                dotColor: '#D47FA6', 
                customStyles: { 
                  text: { 
                    text: moodEmojis[mood] || '',
                    fontWeight: 'bold'
                  } 
                } 
              };
              return acc;
            }, {})}
            onDayPress={(day) => {
              const selectedMood = moods[day.dateString];
              if (selectedMood) {
                navigation.navigate('MoodDetail', { 
                  moodData: selectedMood,
                  onUpdate: () => {
                    // Refresh data after returning from detail view
                    useEffect(() => {
                      if (!userId) return;
                      fetchMoods();
                    }, [userId]);
                  }
                });
              }
            }}
          />
          <ScrollView style={styles.averageContainer}>
            {Object.keys(monthlyAverage).sort().reverse().map(month => (
              <View key={month} style={[
                styles.averageItem, 
                { backgroundColor: getMoodColor(monthlyAverage[month]) }
              ]}>
                <Text style={styles.averageText}>
                  {month}: Average Mood - {monthlyAverage[month]}
                </Text>
                <Text style={styles.averageDescription}>
                  {getMoodDescription(parseFloat(monthlyAverage[month]))}
                </Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const getMoodDescription = (avg) => {
  if (avg >= 4) return 'Mostly positive moods';
  if (avg >= 2.5) return 'Mixed or neutral moods';
  if (avg >= 1) return 'Somewhat negative moods';
  return 'Mostly negative moods';
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  backButton: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  title: {
    fontSize: theme.text.title,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
  },
  averageContainer: {
    marginTop: theme.spacing.md,
  },
  averageItem: {
    ...commonStyles.card,
    marginBottom: theme.spacing.sm,
  },
  averageText: {
    fontSize: theme.text.body,
    color: theme.colors.textPrimary,
  },
  averageDescription: {
    fontSize: theme.text.caption,
    color: theme.colors.textSecondary,
  },
});

export default AssessmentScreen;