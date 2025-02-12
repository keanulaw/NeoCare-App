import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { db } from '../firebaseConfig'; // Import Firestore
import { collection, getDocs } from 'firebase/firestore';

export default function Dashboard({ navigation }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'your-collection-name'));
      const docs = querySnapshot.docs.map(doc => doc.data());
      setData(docs);
    };

    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <View>
          <Text style={styles.greeting}>Hello</Text>
          <Text style={styles.name}>Shannon</Text>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <Image source={require('../assets/notification-icon.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TextInput style={styles.searchBar} placeholder="Search" placeholderTextColor="#888" />

      {/* Quick Access Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.circleButton}
          onPress={() => navigation.navigate('ConsultantScreen')} // Navigate to ConsultantScreen
        >
          <Image source={require('../assets/consultants-icon.png')} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Consultants</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.circleButton}
          onPress={() => navigation.navigate('BirthingCenterLocator')} // Navigate to BirthingCenterLocator
        >
          <Image source={require('../assets/birth-centers-icon.png')} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Birth Centers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.circleButton} 
          onPress={() => navigation.navigate('Assessment')}
        >
          <Image source={require('../assets/assessment-icon.png')} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Assessment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleButton}>
          <Image source={require('../assets/tracker-icon.png')} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Tracker</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleButton}>
          <Image source={require('../assets/chat-bot-icon.png')} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Chat Bot</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.appointments}>
        <View style={styles.appointmentsHeader}>
          <Text style={styles.appointmentsTitle}>Upcoming Appointments</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.appointmentCard}>
          <Text style={styles.appointmentDate}>June 15, 2024</Text>
          <Text style={styles.appointmentDetails}>Glucose screening test:</Text>
        </View>
      </View>

      {data.map((item, index) => (
        <Text key={index}>{JSON.stringify(item)}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
  },
  greeting: {
    fontSize: 18,
    color: '#D47FA6',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D47FA6',
  },
  notificationIcon: {
    padding: 10,
  },
  icon: {
    width: 24,
    height: 24,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginVertical: 10,
    elevation: 2,
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  circleButton: {
    backgroundColor: '#fff',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginBottom: 5,
  },
  buttonText: {
    fontSize: 10,
    color: '#D47FA6',
    textAlign: 'center',
  },
  appointments: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  appointmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D47FA6',
  },
  viewAll: {
    color: '#FF6F61',
    fontSize: 14,
  },
  appointmentCard: {
    backgroundColor: '#F8BBD0',
    borderRadius: 15,
    padding: 15,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#555',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 3,
  },
  footerIcon: {
    width: 24,
    height: 24,
  },
});