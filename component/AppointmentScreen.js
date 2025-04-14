import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import moment from 'moment-timezone';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';

const getNextAvailableDate = (availableDays) => {
  const phTime = moment().tz('Asia/Manila');
  let date = phTime.clone().startOf('day');
  for (let i = 0; i < 7; i++) {
    const currentDay = date.format('dddd');
    if (availableDays.includes(currentDay)) {
      return date.toDate();
    }
    date.add(1, 'day');
  }
  return phTime.toDate();
};

const AppointmentScreen = ({ route, navigation }) => {
  const { consultant } = route.params;
  const initialDate = getNextAvailableDate(consultant.availableDays);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedConsultationHour, setSelectedConsultationHour] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectedAvailableDay = moment(selectedDate).tz('Asia/Manila').format('dddd');

  useEffect(() => {
    const fetchBookedTimes = async () => {
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
          if (data.consultationHour) booked.push(data.consultationHour);
        });
        setBookedTimes(booked);
      } catch (error) {
        console.error("Error fetching booked times:", error);
        Alert.alert("Error", `Error fetching booked times: ${error.message}`);
      }
    };

    if (consultant.availableDays.includes(selectedAvailableDay)) {
      fetchBookedTimes();
    }
  }, [selectedDate, consultant.id]);

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      const phTime = moment(date).tz('Asia/Manila');
      const selectedDay = phTime.format('dddd');
      
      if (consultant.availableDays.includes(selectedDay)) {
        setSelectedDate(phTime.toDate());
        setSelectedConsultationHour(null);
      } else {
        Alert.alert(
          "Invalid Day",
          `This consultant is only available on ${consultant.availableDays.join(', ')}`
        );
      }
    }
  };

  const handleMakeAppointment = async () => {
    if (!selectedConsultationHour || !selectedPlatform) {
      Alert.alert("Incomplete Selection", "Please select consultation hour and platform.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Not Logged In", "Please log in to make an appointment.");
        return;
      }

      const [time, modifier] = selectedConsultationHour.split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours);
      minutes = parseInt(minutes);

      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes);

      await addDoc(collection(db, "appointmentRequests"), {
        consultantId: consultant.id,
        consultantName: consultant.name,
        userId: user.uid,
        fullName: user.displayName || (await getDoc(doc(db, "users", user.uid))).data()?.fullName || "User",
        date: appointmentDate,
        availableDay: selectedAvailableDay,
        consultationHour: selectedConsultationHour,
        platform: selectedPlatform,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Success",
        "Appointment scheduled!",
        [{ text: "OK", onPress: () => navigation.navigate('ConsultantScreen') }]
      );
    } catch (error) {
      Alert.alert("Error", `Failed to schedule: ${error.message}`);
    }
  };

  const availableConsultationHours = consultant.consultationHours.filter(
    hour => !bookedTimes.includes(hour)
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.specialtyText}>Specialty Information</Text>
          <Image source={{ uri: consultant.photoUrl }} style={styles.image} />
          <Text style={styles.name}>Dr. {consultant.name}</Text>
          <Text style={styles.specialty}>{consultant.specialty}</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>
              Select Date (Available: {consultant.availableDays.join(', ')})
            </Text>
            <TouchableOpacity 
              style={styles.pickerButton} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerText}>
                {moment(selectedDate).tz('Asia/Manila').format('LLLL')}
              </Text>
            </TouchableOpacity>
          </View>

          {availableConsultationHours.length > 0 ? (
            <View style={styles.selectionContainer}>
              <Text style={styles.label}>Available Times for {selectedAvailableDay}</Text>
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
            </View>
          ) : (
            <Text style={styles.noAvailableText}>
              No available times for {selectedAvailableDay}
            </Text>
          )}

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
        </View>
        <TouchableOpacity style={styles.button} onPress={handleMakeAppointment}>
          <Text style={commonStyles.buttonText}>Book Appointment</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
  card: {
    ...commonStyles.card,
    marginBottom: theme.spacing.md,
  },
  button: {
    ...commonStyles.buttonPrimary,
    marginTop: theme.spacing.md,
  },
  specialtyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.text.subheading,
    marginBottom: theme.spacing.lg,
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
  noAvailableText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 5,
  },
});

export default AppointmentScreen;
