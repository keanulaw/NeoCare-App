import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AppointmentScreen = ({ route, navigation }) => {
  const { consultant } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleMakeAppointment = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert("Not Logged In", "Please log in to make an appointment.");
        return;
      }

      const user = auth.currentUser;
      
      // Create a combined date-time object
      const [time, modifier] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours);
      minutes = parseInt(minutes);

      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes);

      const appointmentRequest = {
        consultantId: consultant.id,
        consultantName: consultant.name,
        userId: user.uid,
        userName: user.displayName || "User",
        date: appointmentDate,  // Use the combined date-time
        time: selectedTime,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "appointmentRequests"), appointmentRequest);
      
      Alert.alert(
        "Success",
        "Your appointment has been scheduled!",
        [{ text: "OK", onPress: () => navigation.navigate('ConsultantScreen') }]
      );

    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Error", `Failed to schedule appointment. ${error.message}`);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      const formattedTime = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setSelectedTime(formattedTime);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: consultant.photoUrl }} style={styles.image} />
      <Text style={styles.name}>Dr. {consultant.name}</Text>
      <Text style={styles.specialty}>{consultant.specialty}</Text>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Select Date</Text>
        <TouchableOpacity 
          style={styles.pickerButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.pickerText}>
            {selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Select Time</Text>
        <TouchableOpacity 
          style={styles.pickerButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.pickerText}>{selectedTime}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.confirmButton} 
        onPress={handleMakeAppointment}
      >
        <Text style={styles.confirmButtonText}>Confirm Appointment</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={handleTimeChange}
          is24Hour={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
    padding: 20,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  specialty: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
  },
  pickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#D47FA6',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppointmentScreen; 