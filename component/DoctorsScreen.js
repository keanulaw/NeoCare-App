import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import CustomHeader from './CustomHeader';

export default function DoctorsScreen({ route, navigation }) {
  // pull in whichever params you passed
  const {
    birthCenterId,
    birthCenterName,
    clinicId,
    clinicName,
  } = route.params;

  // choose the “center” id & name
  const centerId   = birthCenterId || clinicId;
  const centerName = birthCenterName || clinicName;

  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  // hide RN header, show our CustomHeader instead
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // fetch only “accepted” consultants
  useEffect(() => {
    (async () => {
      try {
        const colRef = collection(db, 'consultants');

        // first try matching by birthCenterName
        let q = query(
          colRef,
          where('approvalStatus', '==', 'accepted'),
          where('birthCenterName', '==', centerName)
        );

        const snap = await getDocs(q);

        // if none found by name, fall back to clinicId:
        if (snap.empty && centerId) {
          q = query(
            colRef,
            where('approvalStatus', '==', 'accepted'),
            where('clinicId',      '==', centerId)
          );
        }

        const finalSnap = snap.empty ? await getDocs(q) : snap;
        const docs       = finalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDoctors(docs);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [centerName, centerId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D47FA6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title={centerName}
        navigation={navigation}
        backButton={true}
      />

      {doctors.length === 0 ? (
        <View style={styles.center}>
          <Text>No doctors found for this center.</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>
                {item.name || item.email}
              </Text>
              <Text style={styles.specialty}>
                {item.specialty || ''}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF4E6' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    elevation: 3,
  },
  name:      { fontSize: 18, fontWeight: 'bold', color: '#D47FA6' },
  specialty: { fontSize: 14, color: '#666', marginTop: 4 },
});
