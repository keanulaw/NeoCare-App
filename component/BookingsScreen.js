// src/screens/BookingsScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableOpacity
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';
import CustomHeader from './CustomHeader';

export default function BookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error(err);
      setLoading(false);
      Alert.alert('Error', 'Could not load your bookings.');
    });

    return () => unsub();
  }, []);

  const handlePay = async (booking) => {
    try {
      // 1) request a PayMongo link
      const resp = await fetch(
        'http://192.168.1.2:3000/api/payments/link',  // ← include your port!
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: booking.amount }),
        }
      );
      const { url, error } = await resp.json();
      if (error || !url) throw new Error(error || 'No payment URL returned');

      // 2) open the hosted checkout
      await Linking.openURL(url);

      // 3) mark as paid in Firestore
      await updateDoc(doc(db, 'bookings', booking.id), {
        paymentStatus: 'paid'
      });

    } catch (e) {
      console.error('Payment error', e);
      Alert.alert('Payment failed', e.message || 'Try again later.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.appointmentCard}>
      <Text style={styles.appointmentTitle}>Dr. {item.doctorName || item.doctorId}</Text>

      <Text style={styles.appointmentDetails}>
        📅 { new Date(item.dateTime.seconds * 1000).toLocaleString() }
      </Text>

      <Text style={styles.appointmentStatus}>
        Status: <Text style={{ fontWeight:'bold' }}>{item.status}</Text>
      </Text>
      <Text style={styles.appointmentStatus}>
        Payment: <Text style={{ fontWeight:'bold' }}>{item.paymentStatus}</Text>
      </Text>

      {item.status === 'approved' && item.paymentStatus === 'unpaid' && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => handlePay(item)}
        >
          <Text style={styles.payButtonText}>
            Pay ₱{(item.amount / 100).toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader title="My Appointments" navigation={navigation} />
      {bookings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noAppointmentsText}>No bookings yet.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={b => b.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  listContainer: {
    padding: 15,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: theme.colors.textSecondary || '#666',
  },
  appointmentCard: {
    ...commonStyles.card,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary || '#333',
    marginBottom: 8,
  },
  appointmentDetails: {
    fontSize: 16,
    color: theme.colors.textPrimary || '#333',
    marginBottom: 8,
  },
  appointmentStatus: {
    fontSize: 14,
    color: theme.colors.textSecondary || '#666',
    marginBottom: 4,
  },
  payButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: theme.colors.primary || '#007AFF',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
