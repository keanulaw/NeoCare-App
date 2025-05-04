// AssessmentScreen.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { db } from '../firebaseConfig';
import theme from '../src/theme';
import CustomHeader from './CustomHeader';

const MOOD_EMOJIS = {
  Happy: '😊',
  Sad: '😢',
  Angry: '😡',
  Tired: '😴',
  Excited: '😃',
  Neutral: '😐',
  Sick: '🤒',
};

const MOOD_VALUES = {
  Happy: 5,
  Excited: 4,
  Neutral: 3,
  Tired: 2,
  Sad: 1,
  Angry: 0,
  Sick: -1,
};

const MOOD_COLORS = {
  Happy: '#4CAF50',
  Excited: '#8BC34A',
  Neutral: '#FFC107',
  Tired: '#FF9800',
  Sad: '#FF5722',
  Angry: '#F44336',
  Sick: '#9C27B0',
};

const generateMoodDocId = (userId, date) => `${userId}_${date}`;

export default function AssessmentScreen({ navigation }) {
  const [moods, setMoods] = useState({});
  const [monthlyAvg, setMonthlyAvg] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const fetchMoods = useCallback(async () => {
    if (!userId) {
      setError('No user logged in.');
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const q = query(collection(db, 'moods'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const data = {};
      snap.forEach(docSnap => {
        const d = docSnap.data();
        // keep only one entry per date
        if (!data[d.date] || docSnap.id === generateMoodDocId(userId, d.date)) {
          data[d.date] = { id: docSnap.id, ...d };
        }
      });
      setMoods(data);

      // calculate monthly averages
      const agg = {};
      Object.values(data).forEach(({ date, mood }) => {
        const month = date.slice(0, 7); // "YYYY-MM"
        if (!agg[month]) agg[month] = { sum: 0, count: 0 };
        agg[month].sum += MOOD_VALUES[mood] ?? 0;
        agg[month].count += 1;
      });
      const avg = {};
      Object.entries(agg).forEach(([m, { sum, count }]) => {
        avg[m] = +(sum / count).toFixed(2);
      });
      setMonthlyAvg(avg);
    } catch (e) {
      console.error(e);
      setError('Failed to load moods.');
      Alert.alert('Error', 'Could not fetch your mood entries.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  // minimal markedDates so the calendar behaves correctly
  const markedDates = useMemo(() => {
    return Object.keys(moods).reduce((acc, date) => {
      acc[date] = { marked: true };
      return acc;
    }, {});
  }, [moods]);

  // prepare monthly list for display
  const monthlyList = useMemo(() => {
    return Object.entries(monthlyAvg)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([month, avg]) => {
        const label = dayjs(month + '-01').format('MMMM YYYY');
        let desc = '';
        if (avg >= 4.5) desc = 'Your mood shines bright! Keep it up!';
        else if (avg >= 4) desc = 'Your days are mostly joyful!';
        else if (avg >= 3) desc = 'Managing well, despite ups & downs.';
        else if (avg >= 2) desc = 'Some days are challenging; be kind to yourself.';
        else if (avg >= 1) desc = 'Tough time—consider reaching out for support.';
        else desc = 'Mood is low. Take extra care of yourself.';
        return { month: label, avg, desc };
      });
  }, [monthlyAvg]);

  if (loading && !Object.keys(moods).length) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Mood Assessment" navigation={navigation} />

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <Calendar
            markedDates={markedDates}
            markingType="custom"
            theme={{
              backgroundColor: theme.bg,
              calendarBackground: theme.bg,
              textSectionTitleColor: theme.accent,
              selectedDayBackgroundColor: theme.primary,
              selectedDayTextColor: '#fff',
              todayTextColor: theme.secondary,
              dayTextColor: theme.text,
              textDisabledColor: theme.muted,
              arrowColor: theme.accent,
              monthTextColor: theme.accent,
              indicatorColor: theme.primary,
            }}
            dayComponent={({ date, state }) => {
              const entry = moods[date.dateString];
              const emoji = entry ? MOOD_EMOJIS[entry.mood] : null;
              return (
                <View style={styles.dayContainer}>
                  {/* always show day number */}
                  <Text style={[styles.dayNumber, state === 'disabled' && styles.disabled]}>
                    {date.day}
                  </Text>
                  {/* overlay emoji if a mood exists for that day */}
                  {emoji && <Text style={styles.emoji}>{emoji}</Text>}
                </View>
              );
            }}
            onDayPress={day => {
              const entry = moods[day.dateString];
              if (entry) {
                navigation.navigate('MoodDetail', {
                  moodData: entry,
                  onUpdate: fetchMoods,
                });
              }
            }}
          />

          <ScrollView
            style={styles.avgContainer}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={fetchMoods} tintColor={theme.primary} />
            }
          >
            {monthlyList.length === 0 && (
              <View style={styles.centered}>
                <Text style={styles.noDataText}>No mood entries yet.</Text>
              </View>
            )}
            {monthlyList.map(({ month, avg, desc }) => {
              // pick a background color based on average
              const colorKey = Object.keys(MOOD_VALUES).find(k => MOOD_VALUES[k] <= avg);
              return (
                <View
                  key={month}
                  style={[styles.avgItem, { backgroundColor: MOOD_COLORS[colorKey] || theme.primary }]}
                >
                  <Text style={styles.avgTitle}>
                    {month} — {avg}/5
                  </Text>
                  <Text style={styles.avgDesc}>{desc}</Text>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  avgContainer: {
    flex: 1,
    padding: 16,
  },
  avgItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avgTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 6,
  },
  avgDesc: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  noDataText: {
    fontSize: 16,
    color: theme.muted,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dayContainer: {
    width: 32,       // match the calendar’s cell size
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    color: '#333',
    lineHeight: 16,
  },
  emoji: {
    fontSize: 18,
    marginTop: -2,   // nudge if needed
  },
  disabled: {
    color: '#ccc',
  },
});
