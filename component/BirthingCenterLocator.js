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

// Import Firestore functions and your Firestore instance
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBcJDGxtpPyKTJaH8VsPdWq3RkohUNkfd4'; // Replace with your actual API key

const BirthingCenterLocator = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [birthingCenters, setBirthingCenters] = useState([]);
  const [registeredClinics, setRegisteredClinics] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Get the user's current location
  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLoadingLocation(false);
        return;
      }
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location.coords);
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setLoadingLocation(false);
      }
    };
    getLocation();
  }, []);

  // Fetch nearby birthing centers from the Google Places API when userLocation is ready
  useEffect(() => {
    if (userLocation) {
      fetchNearbyCenters(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation]);

  // Function to fetch nearby birthing centers using Google Places API
  const fetchNearbyCenters = async (lat, lng) => {
    console.log('Fetching nearby centers for location:', lat, lng);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&keyword=birth&key=${GOOGLE_MAPS_API_KEY}`
      );
      const result = await response.json();
      console.log('API response:', result);
      if (result.results) {
        setBirthingCenters(result.results);
      } else {
        Alert.alert('No birthing centers found nearby.');
      }
    } catch (error) {
      console.error('Error fetching nearby centers:', error);
    }
  };

  // Fetch clinics registered in your system (with role "admin") from Firestore
  useEffect(() => {
    const fetchRegisteredClinics = async () => {
      try {
        const clinicsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'admin')
        );
        const querySnapshot = await getDocs(clinicsQuery);
        const clinicsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRegisteredClinics(clinicsData);
      } catch (error) {
        console.error('Error fetching registered clinics:', error);
      }
    };
    fetchRegisteredClinics();
  }, []);

  // Optimize filtering for clinics using useMemo
  const filteredClinics = useMemo(() => {
    return registeredClinics.filter((clinic) =>
      clinic.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, registeredClinics]);

  // Function to calculate distance (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Optimize filtering for birth centers:
  // First, filter centers by distance (10 km), then (if searchTerm exists) filter by name/vicinity.
  const filteredCenters = useMemo(() => {
    let centers = birthingCenters.filter((center) => {
      if (!userLocation || !center.geometry || !center.geometry.location) return false;
      const { lat, lng } = center.geometry.location;
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lng
      );
      return distance <= 10;
    });
    if (searchTerm.trim() !== '') {
      centers = centers.filter(
        (center) =>
          center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (center.vicinity &&
            center.vicinity.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return centers;
  }, [birthingCenters, userLocation, searchTerm]);

  // Open directions in Google Maps for the selected location
  const openDirections = (center) => {
    if (!userLocation) {
      Alert.alert('User location not available');
      return;
    }
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${center.geometry.location.lat},${center.geometry.location.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    Linking.openURL(url).catch((err) =>
      Alert.alert('Error', 'Unable to open directions')
    );
  };

  if (loadingLocation) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#D47FA6" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Birthing Center Locator" navigation={navigation} />

      {/* Unified Search Bar for both Clinics & Birth Centers */}
      <TextInput
        style={styles.commonSearchInput}
        placeholder="Search clinics & birth centers..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {/* Clinics Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>
          Clinics Available Through Our App
        </Text>
        <FlatList
          data={filteredClinics}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.clinicName}</Text>
              <Text style={styles.cardSubtitle}>{item.email}</Text>
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  onPress={() => {
                    if (item.location && item.location.lat && item.location.lng) {
                      // Create an object structure similar to Google Places results
                      openDirections({
                        geometry: {
                          location: {
                            lat: item.location.lat,
                            lng: item.location.lng,
                          },
                        },
                      });
                    } else {
                      Alert.alert(
                        'Location data not available for this clinic.'
                      );
                    }
                  }}
                >
                  <Text style={styles.cardLink}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text>No clinics available through our app.</Text>
            </View>
          }
        />
      </View>

      {/* Birth Centers Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Birth Centers Near You</Text>
        {/* GooglePlacesAutocomplete for location change */}
        <GooglePlacesAutocomplete
          placeholder="Search for a location..."
          fetchDetails={true}
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
        {/* Display filtered birth centers */}
        <FlatList
          data={filteredCenters}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>
                {item.vicinity || 'No address provided'}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardStatus}>
                  {item.business_status || 'Status N/A'}
                </Text>
                <TouchableOpacity onPress={() => openDirections(item)}>
                  <Text style={styles.cardLink}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text>No centers to show.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#D47FA6',
    marginTop: 10,
  },
  // Unified search input styling
  commonSearchInput: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 10,
    fontSize: 16,
    color: '#333',
    elevation: 3,
  },
  sectionContainer: {
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    marginLeft: 10,
    color: '#D47FA6',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D47FA6',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStatus: {
    fontSize: 12,
    color: '#FF6F61',
  },
  cardLink: {
    fontSize: 12,
    color: '#007BFF',
  },
  emptyList: {
    alignItems: 'center',
    marginTop: 20,
  },
  // Styling for the Google Places search input within the birth centers section
  googleSearchInputContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 3,
  },
  googleSearchInput: {
    padding: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default BirthingCenterLocator;
