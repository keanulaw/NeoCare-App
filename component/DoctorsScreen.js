// src/screens/DoctorsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import CustomHeader from './CustomHeader';

const theme = {
  colors: {
    primary: '#D47FA6',
    background: '#FFF4E6',
    text: '#333',
    subtext: '#666',
  }
};

export default function DoctorsScreen({ route, navigation }) {
  const { centerId, centerName } = route.params;
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // hide native header
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      try {
        const colRef = collection(db, 'consultants');

        // 1️⃣ try matching by birthCenterName
        let q = query(
          colRef,
          where('approvalStatus', '==', 'accepted'),
          where('birthCenterName', '==', centerName)
        );
        let snap = await getDocs(q);

        // 2️⃣ if none found, fall back to clinicId
        if (snap.empty && centerId) {
          q = query(
            colRef,
            where('approvalStatus', '==', 'accepted'),
            where('clinicId', '==', centerId)
          );
          snap = await getDocs(q);
        }

        setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Fetch doctors failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [centerId, centerName]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title={centerName} navigation={navigation} backButton />

      {doctors.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            No doctors found for this center.
          </Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('ConsultantDetail', { consultantId: item.id })
              }
            >
              <Text style={styles.name}>{item.name || item.email}</Text>
              {item.specialty && (
                <Text style={styles.specialty}>{item.specialty}</Text>
              )}
              {item.hourlyRate != null && (
                <Text style={styles.rate}>₱{item.hourlyRate}/hr</Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: theme.colors.subtext, fontSize: 16 },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  name:      { fontSize: 18, fontWeight: '600', color: theme.colors.primary },
  specialty: { fontSize: 14, color: theme.colors.subtext, marginTop: 4 },
  rate:      { marginTop: 6, fontSize: 14, color: theme.colors.subtext, fontWeight: '500' },
});
