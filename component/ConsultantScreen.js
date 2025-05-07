// src/screens/ConsultantScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Image as ExpoImage } from 'expo-image';
import CustomHeader from './CustomHeader';
import theme from '../src/theme';

export default function ConsultantScreen({ navigation }) {
  const [consultants, setConsultants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const cSnap = await getDocs(collection(db, 'consultants'));
        const cons = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const rSnap = await getDocs(
          query(collection(db, 'bookings'), where('rating', '>', 0))
        );
        const ratings = rSnap.docs.map(d => d.data());

        const map = {};
        ratings.forEach(({ consultantId, rating }) => {
          if (!map[consultantId]) map[consultantId] = { sum: 0, count: 0 };
          map[consultantId].sum += rating;
          map[consultantId].count += 1;
        });

        const merged = cons.map(c => {
          const rec = map[c.id];
          return {
            ...c,
            avgRating: rec ? (rec.sum / rec.count).toFixed(1) : null,
          };
        });

        setConsultants(merged);
      } catch (e) {
        console.error('Fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = consultants.filter(c =>
    c.hourlyRate != null &&
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('ConsultantDetail', { consultantId: item.id })
      }
    >
      <View style={styles.card}>
        <ExpoImage
          source={{ uri: item.profilePhoto }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name || 'Unknown'}</Text>
          <Text style={styles.specialty}>{item.specialty || '-'}</Text>
          <Text style={styles.rating}>
            {item.avgRating != null ? `⭐ ${item.avgRating}` : 'No ratings yet'}
          </Text>
          <Text style={styles.rate}>
            {item.hourlyRate != null
              ? `₱${item.hourlyRate}/hr`
              : 'Rate to be announced'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Consultants" navigation={navigation} />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            value={search}
            onChangeText={setSearch}
          />
        }
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background || '#F5F5F5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchInput: {
    borderBottomWidth: 1,
    borderColor: '#D47FA6',
    padding: 10,
    margin: 16,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  image: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  specialty: { fontSize: 14, color: '#666' },
  rating: { fontSize: 14, color: '#FFD700', marginTop: 4 },
  rate: { fontSize: 14, color: '#333', marginTop: 2, fontWeight: '600' },
});
