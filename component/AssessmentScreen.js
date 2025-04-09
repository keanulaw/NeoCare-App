import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';
import CustomHeader from './CustomHeader'; // Import the CustomHeader

// A warm palette with friendly emojis.
const moodEmojis = {
  Happy: '😊',
  Sad: '😢',
  Angry: '😡',
  Tired: '😴',
  Excited: '😃',
  Neutral: '😐',
  Sick: '🤒',
};

// Generate unique document ID combining userId and date.
const generateMoodDocId = (userId, date) => `${userId}_${date}`;

const AssessmentScreen = ({ navigation }) => {
  const [moods, setMoods] = useState({});
  const [monthlyAverage, setMonthlyAverage] = useState({});
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Function to fetch moods from Firestore.
  const fetchMoods = async () => {
    if (!userId) {
      console.error('User ID is undefined');
      return;
    }

    try {
      setLoading(true);
      const q = query(collection(db, 'moods'), where('userId', '==', userId));
      const moodSnapshot = await getDocs(q);
      const moodData = {};

      moodSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const date = data.date;
        // Keep one mood entry per date.
        if (!moodData[date] || docSnap.id === generateMoodDocId(userId, date)) {
          moodData[date] = { 
            id: docSnap.id, 
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

  useEffect(() => {
    fetchMoods();
  }, [userId]);

  // Calculate monthly average mood with numeric mapping.
  const calculateMonthlyAverage = (moodData) => {
    const monthlyData = {};
    const moodValues = {
      Happy: 5,
      Excited: 4,
      Neutral: 3,
      Tired: 2,
      Sad: 1,
      Angry: 0,
      Sick: -1,
    };

    Object.keys(moodData).forEach(date => {
      const month = date.slice(0, 7); // e.g., "2025-04"
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, count: 0 };
      }
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

  // Return a color based on the average mood.
  const getMoodColor = (avg) => {
    const value = parseFloat(avg);
    if (value >= 4) return '#4CAF50'; // Very positive
    if (value >= 2.5) return '#FFC107'; // Moderate
    if (value >= 1) return '#FF9800'; // Low
    return '#F44336'; // Very low
  };

  // Supportive mood description based on average value.
  const getMoodDescription = (avg) => {
    if (avg >= 4.5) return 'Your mood shines bright! Keep it up!';
    if (avg >= 4) return 'Your days are mostly joyful!';
    if (avg >= 3) return 'You are managing well, despite ups and downs.';
    if (avg >= 2) return 'Some days are challenging; be kind to yourself.';
    if (avg >= 1) return 'It seems you are having a tough time. Please reach out for support if needed.';
    return 'Your mood is low. Remember to take extra care of yourself.';
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Assessment" navigation={navigation} />
      {loading ? (
        <ActivityIndicator size="large" color="#D47FA6" style={styles.loader} />
      ) : (
        <>
          <Calendar
            // Custom calendar theme to match the improved UI.
            theme={{
              backgroundColor: '#FFF4E6',
              calendarBackground: '#FFF4E6',
              textSectionTitleColor: '#D47FA6',
              selectedDayBackgroundColor: '#D47FA6',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#FF6F61',
              dayTextColor: '#333',
              textDisabledColor: '#d9e1e8',
              arrowColor: '#D47FA6',
              monthTextColor: '#D47FA6',
              indicatorColor: '#D47FA6',
            }}
            markedDates={Object.keys(moods).reduce((acc, date) => {
              const mood = moods[date].mood;
              acc[date] = { 
                marked: true, 
                dotColor: '#D47FA6', 
                customStyles: { 
                  text: { 
                    text: moodEmojis[mood] || '',
                    fontWeight: 'bold',
                    fontSize: 26,  // Larger for a friendly display
                  },
                  container: {
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                } 
              };
              return acc;
            }, {})}
            onDayPress={(day) => {
              const selectedMood = moods[day.dateString];
              if (selectedMood) {
                navigation.navigate('MoodDetail', { 
                  moodData: selectedMood,
                  onUpdate: fetchMoods,
                });
              }
            }}
          />
          <ScrollView style={styles.averageContainer}>
            {Object.keys(monthlyAverage)
              .sort()
              .reverse()
              .map(month => (
                <View key={month} style={[
                  styles.averageItem, 
                  { backgroundColor: getMoodColor(monthlyAverage[month]) },
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
  loader: {
    marginTop: 50,
  },
  averageContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  averageItem: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  averageText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  averageDescription: {
    fontSize: 16,
    color: '#555',
  },
});

export default AssessmentScreen;