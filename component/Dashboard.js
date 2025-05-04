// Dashboard.js

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';
import BabySizeCard from './BabySizeCard'; // ← your existing component
import CustomHeader from './CustomHeader';

const getTimeOfDay = () => {
  const hr = new Date().getHours();
  if (hr < 12) return 'Morning';
  if (hr < 18) return 'Afternoon';
  return 'Evening';
};

export default function Dashboard({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen to bookings (not appointmentRequests)
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'accepted'])
    );

    const unsub = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const now = new Date();

        const upcoming = snapshot.docs
          .map(doc => {
            const data = doc.data();
            // convert Firestore Timestamp to JS Date
            const baseDate = data.date?.toDate() || new Date();
            // parse your stored hour string (e.g. "14:30")
            const [h = 0, m = 0] = (data.hour || '').split(':').map(n => parseInt(n, 10));
            baseDate.setHours(h, m);

            return {
              id: doc.id,
              date: baseDate,
              consultantName: data.consultantName || 'Unknown',
              platform: data.platform || '',
              status: data.status,
            };
          })
          // only keep those at or after now
          .filter(appt => appt.date >= now)
          // sort soonest first
          .sort((a, b) => a.date - b.date);

        setAppointments(upcoming);
        setLoading(false);
      },
      (error) => {
        console.error('Dashboard booking fetch error:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const renderAppointment = ({ item }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() =>
        navigation.navigate('AppointmentDetails', { appointment: item })
      }
    >
      <View style={styles.appointmentContent}>
        <Text style={styles.appointmentDate}>
          {item.date.toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.appointmentTime}>
          {item.date.toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Text style={styles.appointmentDetails}>With Dr. {item.consultantName}</Text>
        <Text style={styles.appointmentPlatform}>{item.platform}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#D47FA6" />
    </TouchableOpacity>
  );

  const quickAccessButtons = [
    { id: '1', name: 'Health Professionals', icon: 'people', screen: 'ConsultantScreen' },
    { id: '2', name: 'Birth Centers', icon: 'place', screen: 'BirthingCenterLocator' },
    { id: '3', name: 'Assessment', icon: 'assessment', screen: 'Assessment' },
    { id: '4', name: 'Tracker', icon: 'track-changes', screen: 'Tracker' },
    { id: '5', name: 'My Appointments', icon: 'book-online', screen: 'Bookings' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.name}>
              {auth.currentUser?.displayName || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="notifications" size={28} color="#D47FA6" />
          </TouchableOpacity>
        </View>

        {/* Baby size card */}
        <BabySizeCard />

        {/* Quick Access Grid */}
        <View style={styles.gridContainer}>
          {quickAccessButtons.map(button => (
            <TouchableOpacity
              key={button.id}
              style={styles.gridButton}
              onPress={() => navigation.navigate(button.screen)}
            >
              <Icon name={button.icon} size={28} color="#D47FA6" />
              <Text style={styles.gridButtonText}>{button.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary || '#D47FA6'} />
        ) : appointments.length > 0 ? (
          <FlatList
            data={appointments}
            renderItem={renderAppointment}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.appointmentsList}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.noAppointments}>
            <Icon name="event-available" size={40} color="#D47FA6" />
            <Text style={styles.noAppointmentsText}>No upcoming appointments</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating chat bot button */}
      <TouchableOpacity
        style={styles.chatBotButton}
        onPress={() => navigation.navigate('ChatBot')}
      >
        <Icon name="chat" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: theme.colors.background || '#F5F5F5' },
  container:  { padding: 15, paddingBottom: 80 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo:   { flex: 1 },
  greeting:   { fontSize: 18, color: '#666' },
  name:       { fontSize: 24, fontWeight: 'bold', color: '#D47FA6' },
  notificationIcon: { padding: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 15 },
  gridButton: {
    width: '30%', backgroundColor: 'white', borderRadius: 15, alignItems: 'center',
    justifyContent: 'center', padding: 15, marginVertical: 8, elevation: 2,
  },
  gridButtonText: { fontSize: 12, color: '#D47FA6', textAlign: 'center', marginTop: 8, fontWeight: '500' },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  sectionTitle:   { fontSize: 20, fontWeight: 'bold', color: '#D47FA6' },
  viewAll:        { color: '#FF6F61', fontSize: 14, fontWeight: '500' },
  appointmentsList: { paddingBottom: 20 },
  appointmentCard: {
    backgroundColor: 'white', borderRadius: 15, padding: 20, marginVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2,
  },
  appointmentContent: { flex: 1 },
  appointmentDate: { fontSize: 16, color: '#333', fontWeight: '500' },
  appointmentTime: { fontSize: 14, color: '#666', marginVertical: 4 },
  appointmentDetails: { fontSize: 14, color: '#D47FA6', fontWeight: '500' },
  appointmentPlatform: { fontSize: 12, color: '#888', marginTop: 4 },
  noAppointments: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  noAppointmentsText: { color: '#666', marginTop: 10, fontSize: 16 },
  chatBotButton: {
    position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: '#D47FA6',
    borderRadius: 30, width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    elevation: 15, zIndex: 999,
  },
});
