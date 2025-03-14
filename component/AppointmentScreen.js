import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';

const AppointmentScreen = ({ route, navigation }) => {
  const { consultant } = route.params;
  
  // State for the appointment date (if needed)
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Selected available day (e.g. "Monday")
  const [selectedAvailableDay, setSelectedAvailableDay] = useState(null);
  // Selected consultation hour (represents the time slot)
  const [selectedConsultationHour, setSelectedConsultationHour] = useState(null);
  // Selected platform (e.g. "Online")
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  // Booked time slots for the selected day (fetched from Firestore)
  const [bookedTimes, setBookedTimes] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch booked consultation hours for the selected day
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (selectedAvailableDay) {
        try {
          const q = query(
            collection(db, "appointmentRequests"),
            where("consultantId", "==", consultant.id),
            where("availableDay", "==", selectedAvailableDay)
          );
          const querySnapshot = await getDocs(q);
          const booked = [];
          querySnapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            if (data.consultationHour) {
              booked.push(data.consultationHour);
            }
          });
          setBookedTimes(booked);
        } catch (error) {
          console.error("Error fetching booked times:", error);
        }
      } else {
        setBookedTimes([]);
      }
    };

    fetchBookedTimes();
  }, [selectedAvailableDay, consultant.id]);

  const handleMakeAppointment = async () => {
    if (!selectedAvailableDay || !selectedConsultationHour || !selectedPlatform) {
      Alert.alert("Incomplete Selection", "Please select an available day, consultation hour, and platform.");
      return;
    }
    
    try {
      if (!auth.currentUser) {
        Alert.alert("Not Logged In", "Please log in to make an appointment.");
        return;
      }
      
      const user = auth.currentUser;
      let fullName = user.displayName || "User";
      
      if (!user.displayName) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          fullName = userDoc.data().fullName || "User";
        }
      }
      
      const appointmentRequest = {
        consultantId: consultant.id,
        consultantName: consultant.name,
        userId: user.uid,
        fullName: fullName,
        date: selectedDate,
        availableDay: selectedAvailableDay,
        consultationHour: selectedConsultationHour,
        platform: selectedPlatform,
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

  // Only show consultation hours that haven't been booked for the selected day
  const availableConsultationHours = consultant.consultationHours.filter(
    hour => !bookedTimes.includes(hour)
  );

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: consultant.photoUrl }} style={styles.image} />
      <Text style={styles.name}>Dr. {consultant.name}</Text>
      <Text style={styles.specialty}>{consultant.specialty}</Text>

      {/* Date Picker */}
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

      {/* Available Days Selection */}
      {consultant.availableDays && consultant.availableDays.length > 0 && (
        <View style={styles.selectionContainer}>
          <Text style={styles.label}>Select Available Day</Text>
          <View style={styles.optionsRow}>
            {consultant.availableDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAvailableDay === day && styles.optionButtonSelected,
                ]}
                onPress={() => {
                  setSelectedAvailableDay(day);
                  setSelectedConsultationHour(null); // Reset time selection if day changes
                }}
              >
                <Text style={[
                  styles.optionText,
                  selectedAvailableDay === day && { color: '#fff' }
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Consultation Hours Selection */}
      {selectedAvailableDay && (
        <View style={styles.selectionContainer}>
          <Text style={styles.label}>Select Consultation Hour</Text>
          {availableConsultationHours.length > 0 ? (
            <View style={styles.optionsRow}>
              {availableConsultationHours.map((hour, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedConsultationHour === hour && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedConsultationHour(hour)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedConsultationHour === hour && { color: '#fff' }
                  ]}>
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noAvailableText}>No available times for {selectedAvailableDay}</Text>
          )}
        </View>
      )}

      {/* Platform Selection */}
      {consultant.platform && consultant.platform.length > 0 && (
        <View style={styles.selectionContainer}>
          <Text style={styles.label}>Select Platform</Text>
          <View style={styles.optionsRow}>
            {consultant.platform.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedPlatform === option && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedPlatform(option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedPlatform === option && { color: '#fff' }
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.confirmButton} 
        onPress={handleMakeAppointment}
        disabled={!selectedAvailableDay || !selectedConsultationHour || !selectedPlatform}
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
    </ScrollView>
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
  selectionContainer: {
    marginBottom: 25,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
    marginBottom: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#D47FA6',
    borderColor: '#D47FA6',
  },
  optionText: {
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
  noAvailableText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 5,
  },
});

export default AppointmentScreen; 