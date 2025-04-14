import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';
import CustomHeader from './CustomHeader';

const BookingsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Include both accepted and pending appointments.
        const q = query(
          collection(db, 'appointmentRequests'),
          where('userId', '==', user.uid),
          where('status', 'in', ['accepted', 'pending'])
        );

        const querySnapshot = await getDocs(q);
        const appointmentsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.date?.toDate() || new Date(),
            consultantName: data.consultantName,
            time: data.consultationHour,
            platform: data.platform,
            status: data.status
          };
        });
        
        setAppointments(appointmentsData);

        // Optional: Alert for each appointment.
        appointmentsData.forEach(appt => {
          Alert.alert(
            'Appointment Reminder',
            `Your appointment with ${appt.consultantName} is scheduled for ${appt.date.toLocaleString()} (Status: ${appt.status})`
          );
        });
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader title="My Appointments" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.container}>
        {appointments.length === 0 ? (
          <Text style={styles.noAppointmentsText}>No appointments found.</Text>
        ) : (
          appointments.map(appt => (
            <View key={appt.id} style={styles.appointmentCard}>
              <Text style={styles.appointmentTitle}>
                Appointment with {appt.consultantName}
              </Text>
              <Text style={styles.appointmentDetails}>
                Date: {appt.date.toLocaleString()}
              </Text>
              <Text style={styles.appointmentDetails}>
                Time: {appt.time} | Platform: {appt.platform}
              </Text>
              <Text style={styles.appointmentStatus}>
                Status: {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  container: {
    padding: 15,
  },
  noAppointmentsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: theme.colors.textSecondary || '#666',
  },
  appointmentCard: {
    ...commonStyles.card,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary || '#333',
    marginBottom: 5,
  },
  appointmentDetails: {
    fontSize: 16,
    color: theme.colors.textPrimary || '#333',
    marginBottom: 3,
  },
  appointmentStatus: {
    fontSize: 14,
    color: theme.colors.textSecondary || '#666',
    marginTop: 5,
  },
});

export default BookingsScreen;
