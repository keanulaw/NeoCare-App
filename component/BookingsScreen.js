import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const BookingsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAcceptedAppointments = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, 'appointmentRequests'),
          where('userId', '==', user.uid),
          where('status', '==', 'accepted')
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
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAcceptedAppointments();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Accepted Appointments</Text>
      
      {appointments.length === 0 ? (
        <Text style={styles.noAppointments}>No accepted appointments found</Text>
      ) : (
        appointments.map((appointment) => (
          <View key={appointment.id} style={styles.card}>
            <Text style={styles.consultantName}>{appointment.consultantName}</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>Date: {appointment.date.toLocaleDateString()}</Text>
              <Text style={styles.detailText}>Time: {appointment.time}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>Platform: {appointment.platform}</Text>
              <Text style={[styles.status, styles.acceptedStatus]}>Status: {appointment.status}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D47FA6',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  consultantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  acceptedStatus: {
    color: '#4CAF50',
  },
  noAppointments: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default BookingsScreen; 