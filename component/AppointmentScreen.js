// AppointmentScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  Alert, Platform, ScrollView,
  SafeAreaView, ActivityIndicator, StyleSheet, Button
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import {
  collection, addDoc, serverTimestamp,
  doc, getDoc, query, where, getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import moment from 'moment-timezone';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';

export default function AppointmentScreen({ route, navigation }) {
  const { consultant } = route.params;
  const usedConsultant = consultant;
  const initialDate = getNextAvailableDate(usedConsultant.availableDays || []);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showIosPicker, setShowIosPicker] = useState(false);

  const fetchBooked = useCallback(async () => {
    const day = moment(selectedDate).tz('Asia/Manila').format('dddd');
    const q = query(
      collection(db, 'appointmentRequests'),
      where('consultantId', '==', usedConsultant.id),
      where('availableDay', '==', day)
    );
    const snap = await getDocs(q);
    setBookedTimes(snap.docs.map(d => d.data().consultationHour));
  }, [selectedDate, usedConsultant.id]);

  useEffect(() => {
    fetchBooked();
  }, [fetchBooked]);

  const handleBook = async () => {
    if (!selectedHour || !selectedPlatform) {
      return Alert.alert('Missing info', 'Select time & platform.');
    }
    setIsBooking(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');

      // Fetch the consultant's hourly rate
      const consultRef = doc(db, 'consultants', usedConsultant.id);
      const consultSnap = await getDoc(consultRef);
      if (!consultSnap.exists()) {
        Alert.alert('Error', 'Doctor not found.');
        return;
      }
      const { hourlyRate } = consultSnap.data();
      if (!hourlyRate || isNaN(hourlyRate) || hourlyRate <= 0) {
        Alert.alert('Error', 'Invalid hourly rate for this doctor.');
        return;
      }

      // Convert to centavos (₱500 → 50000)
      const amount = Math.round(hourlyRate * 100);

      const ph = moment(selectedDate).tz('Asia/Manila');
      const [time, mod] = selectedHour.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (mod === 'PM' && h < 12) h += 12;
      if (mod === 'AM' && h === 12) h = 0;
      const dt = ph.toDate();
      dt.setHours(h, m, 0, 0);

      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        doctorId: usedConsultant.id,
        dateTime: serverTimestamp(),
        status: 'pending',
        amount,            // now based on hourlyRate
        currency: 'PHP',
        paymentStatus: 'unpaid',
        createdAt: serverTimestamp(),
        bookedFor: dt,
      });

      Alert.alert('Success', 'Booked!', [
        { text: 'OK', onPress: () => navigation.navigate('ConsultantScreen') },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Booking failed', err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const availableHours = (usedConsultant.consultationHours || []).filter(
    h => !bookedTimes.includes(h)
  );

  // Unified onChange for both platforms
  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      // Android: event.type will be 'set' or 'dismissed'
      if (event.type === 'set' && selectedDate) {
        setDate(selectedDate);
      }
    } else {
      // iOS: always get a selectedDate
      setDate(selectedDate || date);
      setShowIosPicker(false);
    }
  };

  // Show the picker on tap
  const showPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        onChange,
        mode: 'datetime',
        minimumDate: new Date(),
        is24Hour: true,
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
              onValueChange={v=>setSelectedHour(v)}
            >
              <Picker.Item label="-- pick a time --" value={null}/>
              {availableHours.map(h=>(
                <Picker.Item key={h} label={h} value={h}/>
              ))}
            </Picker>
          </View>

          <View style={styles.selectionContainer}>
            <Text style={styles.label}>Platform</Text>
            <Picker
              selectedValue={selectedPlatform}
              onValueChange={v=>setSelectedPlatform(v)}
            >
              <Picker.Item label="-- pick platform --" value={null}/>
              <Picker.Item label="Online" value="Online"/>
              <Picker.Item label="In Person" value="In Person"/>
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[commonStyles.buttonPrimary, {margin:20}]}
          onPress={handleBook}
          disabled={isBooking}
        >
          {isBooking?(
            <ActivityIndicator color="#FFF"/>
          ):(
            <Text style={commonStyles.buttonText}>Book Appointment</Text>
          )}
        </TouchableOpacity>

        {Platform.OS === 'ios' && showIosPicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
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

const getNextAvailableDate = availableDays=>{
  const ph = moment().tz('Asia/Manila');
  let d = ph.clone().startOf('day');
  for(let i=0;i<7;i++){
    if(availableDays.includes(d.format('dddd'))) return d.toDate();
    d.add(1,'day');
  }
  return ph.toDate();
};

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:'#FFF4E6'},
  card:{...commonStyles.card,margin:20},
  name:{fontSize:24,fontWeight:'bold',color:'#333',textAlign:'center',marginBottom:6},
  rateLabel:{fontSize:16,fontWeight:'600',textAlign:'center',marginBottom:10,color:theme.colors.primary},
  image:{width:120,height:120,borderRadius:60,alignSelf:'center'},
  pickerContainer:{marginVertical:20},
  label:{fontSize:16,fontWeight:'600',color:'#444',marginBottom:10},
  pickerButton:{backgroundColor:'#FFF',borderRadius:10,padding:15,borderWidth:1,borderColor:'#E0E0E0'},
  pickerText:{fontSize:16,color:'#333'},
  selectionContainer:{marginBottom:20},
  picker: { marginTop: 12 },
});
