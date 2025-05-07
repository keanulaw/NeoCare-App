import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import CustomHeader from './CustomHeader';

// Firestore imports
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBcJDGxtpPyKTJaH8VsPdWq3RkohUNkfd4';

const BirthingCenterLocator = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [birthingCenters, setBirthingCenters] = useState([]);
  const [registeredCenters, setRegisteredCenters] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1️⃣ Get user's location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied');
        setLoadingLocation(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserLocation(loc.coords);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // 2️⃣ Fetch nearby via Google Places
  useEffect(() => {
    if (userLocation) {
      fetchNearbyCenters(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation]);

  const fetchNearbyCenters = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}` +
        `&radius=5000&type=hospital&keyword=birth&key=${GOOGLE_MAPS_API_KEY}`
      );
      const json = await res.json();
      setBirthingCenters(json.results || []);
    } catch (e) {
      console.error(e);
      Alert.alert('Error fetching nearby centers');
    }
  };

  // 3️⃣ Fetch registered birth centers (role === 'clinic')
  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'clinic')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRegisteredCenters(data);
      } catch (e) {
        console.error('Error fetching registered centers:', e);
      }
    })();
  }, []);

  // 4️⃣ Filter registered centers by name
  const filteredCenters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return registeredCenters.filter(center => {
      // if birthCenterName is missing, default to empty string
      const name = center.birthCenterName || '';
      return name.toLowerCase().includes(term);
    });
  }, [searchTerm, registeredCenters]);

  // 5️⃣ Filter nearby Places results by distance & name
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = v => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat/2)**2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filteredPlaces = useMemo(() => {
    let list = birthingCenters.filter(c => {
      if (!userLocation || !c.geometry) return false;
      const { lat, lng } = c.geometry.location;
      return calculateDistance(
        userLocation.latitude, userLocation.longitude, lat, lng
      ) <= 10;
    });
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.vicinity || '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [birthingCenters, userLocation, searchTerm]);

  // Open Google Maps directions
  const openDirections = target => {
    if (!userLocation) {
      Alert.alert('No user location');
      return;
    }
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const dest = `${target.lat},${target.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
    Linking.openURL(url).catch(() => Alert.alert('Cannot open maps'));
  };

  if (loadingLocation) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#D47FA6" />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Birthing Center Locator" navigation={navigation} />

      <TextInput
        style={styles.commonSearchInput}
        placeholder="Search birth centers..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {/* Registered Centers */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Registered Birth Centers</Text>
        <FlatList
          data={filteredCenters}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('DoctorsScreen', {
                  clinicId: item.id,
                  clinicName: item.birthCenterName,
                })
              }
            >
              <Text style={styles.cardTitle}>{item.birthCenterName}</Text>
              <Text style={styles.cardSubtitle}>{item.email}</Text>
              <View style={styles.cardFooter}>
                {item.birthCenterLocation?.lat && (
                  <TouchableOpacity
                    onPress={() =>
                      openDirections(item.birthCenterLocation)
                    }
                  >
                    <Text style={styles.cardLink}>Directions</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text>No centers registered in your app.</Text>
            </View>
          }
        />
      </View>

      {/* Nearby Google Places */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Centers Near You</Text>
        <GooglePlacesAutocomplete
          placeholder="Search location…"
          fetchDetails
          onPress={(data, details = null) => {
            if (details) {
              const { lat, lng } = details.geometry.location;
              fetchNearbyCenters(lat, lng);
            }
          }}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
            location: userLocation
              ? `${userLocation.latitude},${userLocation.longitude}`
              : '',
            radius: 5000,
          }}
          styles={{
            textInputContainer: styles.googleSearchInputContainer,
            textInput: styles.googleSearchInput,
          }}
        />
        <FlatList
          data={filteredPlaces}
          keyExtractor={item => item.place_id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>
                {item.vicinity || 'No address'}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardStatus}>
                  {item.business_status || 'Status N/A'}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    openDirections(item.geometry.location)
                  }
                >
                  <Text style={styles.cardLink}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text>No places to show.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF4E6' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#D47FA6' },
  commonSearchInput: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    margin: 10,
    fontSize: 16,
    elevation: 3,
  },
  sectionContainer: { marginVertical: 10 },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#D47FA6',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#D47FA6' },
  cardSubtitle: { fontSize: 14, color: '#666', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardStatus: { fontSize: 12, color: '#FF6F61' },
  cardLink: { fontSize: 12, color: '#007BFF' },
  emptyList: { alignItems: 'center', marginTop: 20 },
  googleSearchInputContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 3,
  },
  googleSearchInput: { padding: 10, fontSize: 16 },
});

export default BirthingCenterLocator;
