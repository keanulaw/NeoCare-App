import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, startAfter, limit } from 'firebase/firestore';
import { Image as ExpoImage } from 'expo-image';
import CustomHeader from './CustomHeader'; // Import the CustomHeader
import theme from '../src/theme'; // Import your theme

export default function ConsultantScreen({ navigation }) {
  const [consultants, setConsultants] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'consultants'));
        if (querySnapshot.empty) {
          console.log('No consultants found.');
          setConsultants([]); // Ensure state is updated even if empty
        } else {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id, // Include the document ID
            ...doc.data(),
          }));
          console.log('Fetched consultants:', data);
          setConsultants(data);
        }
      } catch (error) {
        console.error('Error fetching consultants:', error);
      }
    };

    fetchConsultants();
  }, []);

  const filteredConsultants = consultants.filter(consultant =>
    consultant.name && consultant.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('ConsultantDetail', { consultant: item })}>
      <View style={styles.card}>
        <ExpoImage
          source={{ uri: item.photoUrl }}
          style={styles.image}
          contentFit="cover"
          transition={1000}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name || 'Unknown User'}</Text>
          <Text style={styles.specialty}>{item.specialty || 'No Specialty'}</Text>
          <Text style={styles.rating}>⭐ {item.rating || 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const loadMore = async () => {
    const last = consultants[consultants.length - 1];
    const next = query(
      collection(db, 'consultants'),
      orderBy('name'),
      startAfter(last.name),
      limit(10)
    );
    // Fetch and update state
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Consultants" navigation={navigation} />
      <ScrollView>
        <View style={styles.container}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filteredConsultants}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id || index.toString()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  searchInput: {
    borderBottomWidth: 1,
    borderColor: '#D47FA6',
    padding: 10,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  specialty: {
    fontSize: 14,
    color: '#666',
  },
  rating: {
    fontSize: 14,
    color: '#FFD700',
  },
});
