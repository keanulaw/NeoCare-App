// src/pages/AppointmentScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  Platform, ScrollView,
  SafeAreaView, ActivityIndicator,
  StyleSheet, ToastAndroid
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import {
  collection,
  addDoc,
  Timestamp,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import moment from 'moment-timezone';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';

export default function AppointmentScreen({ route, navigation }) {
  const {
    consultant,
    date: dateParam,
    time: timeParam,
    platform: platformParam
  } = route.params;
  const usedConsultant = consultant;

  const initialDate = dateParam
    ? new Date(`${dateParam}T00:00:00`)
    : getNextAvailableDate(usedConsultant.availableDays || []);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedHour, setSelectedHour] = useState(timeParam || null);
  const [selectedPlatform, setSelectedPlatform] = useState(platformParam || null);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const user = auth.currentUser;
  const userId = user.uid;

  // Available modes
  const modes = [
    ...(usedConsultant.availableModes?.includes('online') ? ['Online'] : []),
    ...(usedConsultant.availableModes?.includes('in-person') ? ['In Person'] : [])
  ];
  const [mode, setMode] = useState(modes[0] || '');

  // Fetch already-booked hours for the selected day
  useEffect(() => {
    (async () => {
      const day = moment(selectedDate).tz('Asia/Manila').format('dddd');
      const dupQ = query(
        collection(db, 'bookings'),
        where('consultantId', '==', usedConsultant.id),
        where('availableDay', '==', day)
      );
      const snap = await getDocs(dupQ);
      setBookedTimes(snap.docs.map(d => d.data().hour));
    })();
  }, [selectedDate, usedConsultant.id]);

  const handleBook = useCallback(async () => {
    if (!selectedHour || !selectedPlatform) {
      ToastAndroid.show('Please select time & platform', ToastAndroid.SHORT);
      return;
    }
    setIsBooking(true);

    try {
      await addDoc(collection(db, 'bookings'), {
        userId,
        consultantId: usedConsultant.id,
        consultantName: usedConsultant.name,
        doctorId: usedConsultant.userId,
        date: Timestamp.fromDate(selectedDate),
        availableDay: moment(selectedDate).tz('Asia/Manila').format('dddd'),
        hour: selectedHour,
        platform: selectedPlatform,
        mode,
        status: 'pending',
        paymentStatus: 'unpaid',
        amount: usedConsultant.hourlyRate * 100,
        createdAt: serverTimestamp(),
      });

      ToastAndroid.show('Booking successful!', ToastAndroid.SHORT);
      navigation.goBack();
    } catch (err) {
      ToastAndroid.show(err.message, ToastAndroid.LONG);
    } finally {
      setIsBooking(false);
    }
  }, [
    userId,
    usedConsultant,
    selectedDate,
    selectedHour,
    selectedPlatform,
    mode,
    navigation
  ]);

  // Date picker handlers
  const onChange = (event, newDate) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && newDate) setSelectedDate(newDate);
    } else {
      setSelectedDate(newDate || selectedDate);
      setShowIosPicker(false);
    }
  };
  const showPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        onChange,
        mode: 'date',
        minimumDate: new Date(),
      });
    } else {
      setShowIosPicker(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.name}>{usedConsultant.name}</Text>
          {usedConsultant.hourlyRate != null && (
            <Text style={styles.rateLabel}>
              ₱{usedConsultant.hourlyRate} / hr
            </Text>
          )}
          <Image
            source={{ uri: usedConsultant.photoUrl }}
            style={styles.image}
          />
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>
              Date (Available: {usedConsultant.availableDays.join(', ')})
            </Text>
            <TouchableOpacity onPress={showPicker} style={styles.pickerButton}>
              <Text style={styles.pickerText}>
                {moment(selectedDate).tz('Asia/Manila').format('LL')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.selectionContainer}>
            <Text style={styles.label}>Select Time</Text>
            <Picker
              selectedValue={selectedHour}
              onValueChange={v => setSelectedHour(v)}
            >
              <Picker.Item label="-- pick a time --" value={null} />
              { (usedConsultant.consultationHours || [])
                  .filter(h => !bookedTimes.includes(h))
                  .map(h => <Picker.Item key={h} label={h} value={h} />)
              }
            </Picker>
          </View>
          <View style={styles.selectionContainer}>
            <Text style={styles.label}>Platform</Text>
            <Picker
              selectedValue={selectedPlatform}
              onValueChange={v => setSelectedPlatform(v)}
            >
              <Picker.Item label="-- pick platform --" value={null} />
              <Picker.Item label="Online" value="Online" />
              <Picker.Item label="In Person" value="In Person" />
            </Picker>
          </View>
          <Text style={styles.label}>Mode</Text>
          <Picker selectedValue={mode} onValueChange={setMode} style={styles.picker}>
            {modes.map(m => <Picker.Item key={m} label={m} value={m} />)}
          </Picker>
        </View>

        <TouchableOpacity
          style={[commonStyles.buttonPrimary, { margin: 20 }]}
          onPress={handleBook}
          disabled={isBooking}
        >
          {isBooking
            ? <ActivityIndicator color="#FFF" />
            : <Text style={commonStyles.buttonText}>Book Appointment</Text>
          }
        </TouchableOpacity>

        {Platform.OS === 'ios' && showIosPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onChange}
            minimumDate={new Date()}
            style={styles.picker}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getNextAvailableDate = availableDays => {
  const today = moment().tz('Asia/Manila').startOf('day');
  for (let i = 0; i < 7; i++) {
    if (availableDays.includes(today.format('dddd'))) {
      return today.toDate();
    }
    today.add(1, 'day');
  }
  return today.toDate();
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF4E6' },
  card: { ...commonStyles.card, margin: 20 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 6 },
  rateLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: theme.colors.primary
  },
  image: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center' },
  pickerContainer: { marginVertical: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#444', marginBottom: 10 },
  pickerButton: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  pickerText: { fontSize: 16, color: '#333' },
  selectionContainer: { marginBottom: 20 },
  picker: { marginTop: 12 },
});
