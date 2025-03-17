import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GetStarted from './component/GetStarted';
import Dashboard from './component/Dashboard';
import CalendarScreen from './component/CalendarScreen';
import MessageScreen from './component/MessageScreen';
import ProfileScreen from './component/ProfileScreen';
import AssessmentScreen from './component/AssessmentScreen'; // Import the AssessmentScreen
import { Image, StyleSheet } from 'react-native';
import app from './firebaseConfig'; // Add this line to import Firebase
import RegisterScreen from './component/RegisterScreen'; // Import the RegisterScreen
import LoginScreen from './component/LoginScreen'; // Import the LoginScreen
import MoodDetail from './component/MoodDetail'; // Import MoodDetail
import BirthingCenterLocator from './component/BirthingCenterLocator'; // Import the component
import ConsultantScreen from './component/ConsultantScreen'; // Import ConsultantScreen
import ConsultantDetailScreen from './component/ConsultantDetailScreen'; // Import the new screen
import ChatScreen from './component/ChatScreen'; // Import the ChatScreen
import AppointmentScreen from './component/AppointmentScreen'; // Import the ChatScreen
import BookingsScreen from './component/BookingsScreen'; // Adjust the path as necessary


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused
              ? require('./assets/home-filled.png')
              : require('./assets/home-outline.png');
          } else if (route.name === 'Calendar') {
            iconName = focused
              ? require('./assets/calendar-filled.png')
              : require('./assets/calendar-outline.png');
          } else if (route.name === 'Message') {
            iconName = focused
              ? require('./assets/message-filled.png')
              : require('./assets/message-outline.png');
          } else if (route.name === 'Profile') {
            iconName = focused
              ? require('./assets/profile-filled.png')
              : require('./assets/profile-outline.png');
          }

          return <Image source={iconName} style={styles.tabIcon} />;
        },
        tabBarActiveTintColor: '#D47FA6', // Active tab color
        tabBarInactiveTintColor: '#888', // Inactive tab color
        tabBarStyle: styles.tabBar, // Custom tab bar style
        headerShown: false, // Hide the header
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Message" component={MessageScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        {/* GetStarted Screen */}
        <Stack.Screen name="GetStarted" component={GetStarted} />
        {/* HomeTabs (Dashboard as Home) */}
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
        {/* Assessment Screen */}
        <Stack.Screen name="Assessment" component={AssessmentScreen} />
        {/* Register Screen */}
        <Stack.Screen name="Register" component={RegisterScreen} />
        {/* Login Screen */}
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* MoodDetail Screen */}
        <Stack.Screen name="MoodDetail" component={MoodDetail} />
        {/* Birthing Center Locator Screen */}
        <Stack.Screen name="BirthingCenterLocator" component={BirthingCenterLocator} />
        {/* Consultant Screen */}
        <Stack.Screen name="ConsultantScreen" component={ConsultantScreen} />
        {/* Consultant Detail Screen */}
        <Stack.Screen name="ConsultantDetail" component={ConsultantDetailScreen} />
        {/* Chat Screen */}
        <Stack.Screen name="Chat" component={ChatScreen} />
        {/* Appointment Screen - adding options for better UX */}
        <Stack.Screen 
          name="AppointmentScreen"
          component={AppointmentScreen}
          options={{
            headerShown: true,
            title: 'Book Appointment',
            headerStyle: {
              backgroundColor: '#FFF4E6',
            },
            headerTintColor: '#D47FA6',
          }}
        />
        {/* Bookings Screen */}
        <Stack.Screen 
          name="Bookings" 
          component={BookingsScreen} 
          options={{ title: 'My Bookings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    elevation: 10,
    paddingVertical: 10,
  },
});