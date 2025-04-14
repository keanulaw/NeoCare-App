import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  FlatList, 
  ActivityIndicator 
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';

const Dashboard = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch upcoming appointments (accepted or pending) for the current user
  useEffect(() => {
    const fetchAppointments = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(
        collection(db, 'appointmentRequests'),
        where('userId', '==', user.uid),
        where('status', 'in', ['accepted', 'pending'])
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const appointmentsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.date ? data.date.toDate() : new Date(),
            consultantName: data.consultantName,
            time: data.consultationHour,
            platform: data.platform,
            status: data.status,
          };
        });
        setAppointments(appointmentsData);
        setLoading(false);
      }, error => {
        console.error("Error fetching appointments:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    };
    fetchAppointments();
  }, []);

  const renderAppointment = ({ item }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
    >
      <View style={styles.appointmentContent}>
        <Text style={styles.appointmentDate}>
          {item.date.toLocaleDateString('en-PH', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        <Text style={styles.appointmentTime}>
          {item.date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.appointmentDetails}>With Dr. {item.consultantName}</Text>
        <Text style={styles.appointmentPlatform}>{item.platform}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#D47FA6" />
    </TouchableOpacity>
  );

  // Quick access buttons (Chat Bot removed from the grid since we have a floating button)
  const quickAccessButtons = [
    { id: '1', name: 'Consultants', icon: 'people', screen: 'ConsultantScreen' },
    { id: '2', name: 'Birth Centers', icon: 'place', screen: 'BirthingCenterLocator' },
    { id: '3', name: 'Assessment', icon: 'assessment', screen: 'Assessment' },
    { id: '4', name: 'Tracker', icon: 'track-changes', screen: 'Tracker' },
    { id: '5', name: 'Bookings', icon: 'book-online', screen: 'Bookings' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.name}>
              {auth.currentUser ? auth.currentUser.displayName || "User" : "User"}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationIcon}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="notifications" size={28} color="#D47FA6" />
          </TouchableOpacity>
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

        {/* Upcoming Appointments Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Appointments List or Loading/Error */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary || '#D47FA6'} />
        ) : appointments.length > 0 ? (
          <FlatList
            data={appointments}
            renderItem={renderAppointment}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.appointmentsList}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.noAppointments}>
            <Icon name="event-available" size={40} color="#D47FA6" />
            <Text style={styles.noAppointmentsText}>No upcoming appointments</Text>
          </View>
        )}
      </ScrollView>
      {/* Floating Chat Bot Button at Bottom Center */}
      <TouchableOpacity 
        style={styles.chatBotButton}
        onPress={() => navigation.navigate('ChatBot')}
      >
        <Icon name="chat" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  container: {
    padding: 15,
    paddingBottom: 80, // extra bottom padding so content doesn't hide behind the chat button
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
  appointmentsList: {
    paddingBottom: 20,
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
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#D47FA6',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 15,
    zIndex: 999,
  },
});

export default Dashboard;