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
  doc,
  getDoc,
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

  // 1️⃣ Initial date
  const initialDate = dateParam
    ? new Date(`${dateParam}T00:00:00`)
    : getNextAvailableDate(usedConsultant.availableDays || []);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // 2️⃣ Time
  const [selectedHour, setSelectedHour] = useState(timeParam || null);

  // 3️⃣ Derive availablePlatforms from consultant.platform
  const modesRaw = Array.isArray(usedConsultant.platform)
    ? usedConsultant.platform
    : [];
  const availablePlatforms = modesRaw
    .map(m => {
      const low = String(m).toLowerCase();
      if (low === 'online') return 'Online';
      if (low === 'in-person' || low === 'in person') return 'In Person';
      return String(m).charAt(0).toUpperCase() + String(m).slice(1);
    })
    .filter((v, i, self) => v && self.indexOf(v) === i);

  const [selectedPlatform, setSelectedPlatform] = useState(
    platformParam || availablePlatforms[0] || null
  );

  // 4️⃣ Booked times for that exact date
  const [bookedTimes, setBookedTimes] = useState([]);

  // 5️⃣ Misc UI state
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // 6️⃣ User info
  const user = auth.currentUser;
  const userId = user.uid;

  // ▶️ Load fullName
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists() && snap.data().fullName) {
          setFullName(snap.data().fullName);
        }
      } catch (e) {
        console.warn('Failed to fetch fullName:', e);
      }
    })();
  }, [userId]);

  // 🔄 Fetch existing bookings for the selected date
  useEffect(() => {
    (async () => {
      try {
        const dayStart = moment(selectedDate).tz('Asia/Manila').startOf('day').toDate();
        const nextDay = moment(dayStart).add(1, 'day').toDate();
        const startTs = Timestamp.fromDate(dayStart);
        const nextTs  = Timestamp.fromDate(nextDay);

        const q = query(
          collection(db, 'bookings'),
          where('consultantId', '==', usedConsultant.id),
          where('date', '>=', startTs),
          where('date', '<', nextTs)
        );
        const snap = await getDocs(q);
        setBookedTimes(snap.docs.map(d => d.data().hour));
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
    })();
  }, [selectedDate, usedConsultant.id]);

  // 📅 Date-picker change with availability check
  const onChangeDate = (event, newDate) => {
    if (!newDate) {
      if (Platform.OS !== 'android') setShowIosPicker(false);
      return;
    }
    const weekday = moment(newDate).tz('Asia/Manila').format('dddd');
    if (!usedConsultant.availableDays.includes(weekday)) {
      ToastAndroid.show(`Not available on ${weekday}.`, ToastAndroid.LONG);
      if (Platform.OS !== 'android') setShowIosPicker(false);
      return;
    }
    setSelectedDate(newDate);
    if (Platform.OS !== 'android') setShowIosPicker(false);
  };

  // ⚙️ Open date picker
  const showPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        onChange: onChangeDate,
        mode: 'date',
        minimumDate: new Date(),
      });
    } else {
      setShowIosPicker(true);
    }
  };

  // 🔘 Handle booking submission
  const handleBook = useCallback(async () => {
    if (!selectedHour || !selectedPlatform) {
      ToastAndroid.show('Please select time & platform', ToastAndroid.SHORT);
      return;
    }
    setIsBooking(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        userId,
        fullName,
        consultantId: usedConsultant.id,
        consultantName: usedConsultant.name,
        doctorId: usedConsultant.userId,
        date: Timestamp.fromDate(selectedDate),
        availableDay: moment(selectedDate).tz('Asia/Manila').format('dddd'),
        hour: selectedHour,
        platform: selectedPlatform,
        mode: selectedPlatform,
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
    fullName,
    usedConsultant,
    selectedDate,
    selectedHour,
    selectedPlatform,
    navigation
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.name}>{usedConsultant.name}</Text>
          {usedConsultant.hourlyRate != null && (
            <Text style={styles.rateLabel}>₱{usedConsultant.hourlyRate} / hr</Text>
          )}
          <Image source={{ uri: usedConsultant.photoUrl }} style={styles.image} />

          {/* Date Picker */}
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

          {/* Time Picker */}
          <View style={styles.selectionContainer}>
            <Text style={styles.label}>Select Time</Text>
            <Picker selectedValue={selectedHour} onValueChange={v => setSelectedHour(v)}>
              <Picker.Item label="-- pick a time --" value={null} />
              {(usedConsultant.consultationHours || [])
                .filter(h => !bookedTimes.includes(h))
                .map(h => <Picker.Item key={h} label={h} value={h} />)}
            </Picker>
          </View>

          {/* Platform Picker */}
          <View style={styles.selectionContainer}>
            <Text style={styles.label}>Platform</Text>
            <Picker
              selectedValue={selectedPlatform}
              onValueChange={v => setSelectedPlatform(v)}
            >
              <Picker.Item label="-- pick a platform --" value={null} />
              {availablePlatforms.map(p => (
                <Picker.Item key={p} label={p} value={p} />
              ))}
            </Picker>
          </View>

          {/* Book Button */}
          <TouchableOpacity
            style={[commonStyles.buttonPrimary, { margin: 20 }]}
            onPress={handleBook}
            disabled={isBooking}
          >
            {isBooking ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={commonStyles.buttonText}>Book Appointment</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* iOS Date Picker */}
        {Platform.OS === 'ios' && showIosPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onChangeDate}
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
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6
  },
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
  picker: { marginTop: 12 }
});
