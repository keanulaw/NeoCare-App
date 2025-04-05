import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, FlatList } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function Dashboard({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'appointmentRequests'),
      where('userId', '==', user.uid),
      where('status', '==', 'confirmed')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appointmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));
      setAppointments(appointmentsData);
    });

    return () => unsubscribe();
  }, []);

  const renderAppointment = ({ item }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
    >
      <View style={styles.appointmentContent}>
        <Text style={styles.appointmentDate}>
          {new Date(item.date).toLocaleDateString('en-PH', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        <Text style={styles.appointmentTime}>
          {new Date(item.date).toLocaleTimeString('en-PH', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
        <Text style={styles.appointmentDetails}>{item.consultantName}</Text>
        <Text style={styles.appointmentPlatform}>{item.platform}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#D47FA6" />
    </TouchableOpacity>
  );

  const quickAccessButtons = [
    { id: '1', name: 'Consultants', icon: 'people', screen: 'ConsultantScreen' },
    { id: '2', name: 'Birth Centers', icon: 'place', screen: 'BirthingCenterLocator' },
    { id: '3', name: 'Assessment', icon: 'assessment', screen: 'Assessment' },
    { id: '4', name: 'Tracker', icon: 'track-changes', screen: 'Tracker' },
    { id: '5', name: 'Bookings', icon: 'book-online', screen: 'Bookings' },
    { id: '6', name: 'Chat Bot', icon: 'chat', screen: 'ChatBot' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
          <Text style={styles.name}>Shannon</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationIcon}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Icon name="notifications" size={28} color="#D47FA6" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search services or consultants"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Access Grid */}
      <View style={styles.gridContainer}>
        {quickAccessButtons.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={styles.gridButton}
            onPress={() => navigation.navigate(button.screen)}
          >
            <Icon name={button.icon} size={28} color="#D47FA6" />
            <Text style={styles.gridButtonText}>{button.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {appointments.length > 0 ? (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.appointmentsList}
        />
      ) : (
        <View style={styles.noAppointments}>
          <Icon name="event-available" size={40} color="#D47FA6" />
          <Text style={styles.noAppointmentsText}>No upcoming appointments</Text>
        </View>
      )}

      {/* Chat Bot Floating Button */}
      <TouchableOpacity 
        style={styles.chatBotButton}
        onPress={() => navigation.navigate('ChatBot')}
      >
        <Icon name="chat" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    color: '#666',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D47FA6',
  },
  notificationIcon: {
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginVertical: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  gridButton: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginVertical: 8,
    elevation: 2,
  },
  gridButtonText: {
    fontSize: 12,
    color: '#D47FA6',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D47FA6',
  },
  viewAll: {
    color: '#FF6F61',
    fontSize: 14,
    fontWeight: '500',
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#D47FA6',
    fontWeight: '500',
  },
  appointmentPlatform: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  noAppointments: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noAppointmentsText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  chatBotButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#D47FA6',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
});