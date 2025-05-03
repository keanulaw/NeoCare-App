// component/CustomHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const CustomHeader = ({
  title,
  navigation: navigationProp,
  showBack = true,
  showBookAppointment = false,
  // if you want to deep-link book appointment with a specific consultant:
  consultant,
}) => {
  // use the prop if given, otherwise grab from context
  const navigation = navigationProp || useNavigation();

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleBookAppointmentPress = () => {
    // pass consultant along if needed:
    navigation.navigate('AppointmentScreen', consultant ? { consultant } : {});
  };

  return (
    <View style={styles.headerContainer}>
      {showBack ? (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#D47FA6" />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={styles.headerTitle}>{title}</Text>

      {showBookAppointment ? (
        <TouchableOpacity
          onPress={handleBookAppointmentPress}
          style={styles.bookButton}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF4E6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 30,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    color: '#D47FA6',
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#D47FA6',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  placeholder: {
    width: 80,
  },
});

export default CustomHeader;
