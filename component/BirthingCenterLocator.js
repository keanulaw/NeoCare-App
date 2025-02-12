import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBcJDGxtpPyKTJaH8VsPdWq3RkohUNkfd4'; // Replace with your actual API key

const BirthingCenterLocator = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [birthingCenters, setBirthingCenters] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Get user's current location
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLoadingLocation(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({
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

  // Automatically fetch nearby birthing centers from Google Places API once location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyCenters(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation]);

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

  // Calculate distance between two coordinates using the Haversine formula (optional filtering)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Optionally, filter centers within a certain radius (e.g., 10 km)
  const filteredCenters = birthingCenters.filter(center => {
    if (!userLocation || !center.geometry || !center.geometry.location) return false;
    const centerLat = center.geometry.location.lat;
    const centerLng = center.geometry.location.lng;
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      centerLat,
      centerLng
    );
    return distance <= 10;
  });

  // Reintroduce the openDirections function
  const openDirections = (center) => {
    if (!userLocation) {
      Alert.alert("User location not available");
      return;
    }
    
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${center.geometry.location.lat},${center.geometry.location.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    
    Linking.openURL(url).catch(err =>
      Alert.alert("Error", "Unable to open directions")
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
    <View style={styles.container}>
      {/* Optional: Still include autocomplete if you want manual search as well */}
      <GooglePlacesAutocomplete
        placeholder="Search"
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
          textInputContainer: styles.searchInputContainer,
          textInput: styles.searchInput,
        }}
      />

      <FlatList
        data={birthingCenters}
        keyExtractor={item => item.place_id}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
    padding: 20,
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
  searchInputContainer: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 10,
    fontSize: 16,
    color: '#333',
    elevation: 3,
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
});

export default BirthingCenterLocator;
