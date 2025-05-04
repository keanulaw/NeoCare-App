import 'react-native-reanimated';
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GetStarted from './component/GetStarted';
import Dashboard from './component/Dashboard';
import BookingsScreen from './component/BookingsScreen'; // Use BookingsScreen for Calendar
import MessageScreen from './component/MessageScreen';
import ProfileScreen from './component/ProfileScreen'; // New Profile screen
import AssessmentScreen from './component/AssessmentScreen';
import { StyleSheet, Alert } from 'react-native';
import app from './firebaseConfig';
import RegisterScreen from './component/RegisterScreen';
import LoginScreen from './component/LoginScreen';
import MoodDetail from './component/MoodDetail';
import BirthingCenterLocator from './component/BirthingCenterLocator';
import ConsultantScreen from './component/ConsultantScreen';
import ConsultantDetailScreen from './component/ConsultantDetailScreen';
import ChatScreen from './component/ChatScreen';
import AppointmentScreen from './component/AppointmentScreen';
import Tracker from './component/Tracker';
import ChatBotScreen from './component/ChatBotScreen';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAuth } from 'firebase/auth';
import {
  registerForPushNotificationsAsync,
  listenForNotifications,
  configureAndroidChannel
} from './component/Notifications'; // Updated path to Notifications.js
import DoctorsScreen from './component/DoctorsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Create an animated version of Ionicons
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

function AnimatedTabIcon({ name, focused, size, color }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focused ? withSpring(1.2) : withSpring(1) }],
  }));

  return <AnimatedIonicons name={name} size={size} color={color} style={animatedStyle} />;
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Message') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <AnimatedTabIcon name={iconName} focused={focused} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: '#D47FA6',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 2,
        },
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 60,
          backgroundColor: '#fff',
          borderRadius: 12,
          elevation: 10, // Android shadow
          shadowColor: '#000', // iOS shadow
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          paddingVertical: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Calendar" component={BookingsScreen} />
      <Tab.Screen name="Message" component={MessageScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function App() {
  useEffect(() => {
    // 1) create Android channel (no-op on iOS)
    configureAndroidChannel();

    // 2) register for push, then POST token to your backend
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        fetch('https://192.168.1.4/api/users/expo-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: getAuth().currentUser.uid,
            token,
          }),
        }).catch(err => console.error('Failed to save push token:', err));
      }
    });

    // 3) handle incoming notifications
    const subscription = listenForNotifications(data => {
      if (data.type === 'bookingAccepted') {
        Alert.alert(
          'Booking Accepted',
          'Your appointment has been accepted—proceed to payment.'
        );
      }
      // handle other data.type if needed
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="GetStarted" component={GetStarted} />
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
        <Stack.Screen name="Assessment" component={AssessmentScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MoodDetail" component={MoodDetail} />
        <Stack.Screen name="BirthingCenterLocator" component={BirthingCenterLocator} />
        <Stack.Screen name="ConsultantScreen" component={ConsultantScreen} />
        <Stack.Screen name="ConsultantDetail" component={ConsultantDetailScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen
          name="AppointmentScreen"
          component={AppointmentScreen}
          options={{
            headerShown: true,
            title: 'Book Appointment',
            headerStyle: { backgroundColor: '#FFF4E6' },
            headerTintColor: '#D47FA6',
          }}
        />
        <Stack.Screen
          name="Bookings"
          component={BookingsScreen}
          options={{ title: 'My Bookings' }}
        />
        <Stack.Screen
          name="Tracker"
          component={Tracker}
          options={{ title: 'Pregnancy Tracker' }}
        />
        <Stack.Screen name="ChatBot" component={ChatBotScreen} options={{ title: 'Chat Bot' }} />
        <Stack.Screen
          name="DoctorsScreen"
          component={DoctorsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

const styles = StyleSheet.create({
  // Additional styles if needed
});