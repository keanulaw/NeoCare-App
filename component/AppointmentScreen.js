// AppointmentScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  Alert, Platform, ScrollView,
  SafeAreaView, ActivityIndicator, StyleSheet
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const {
    doctor,
    date: paramDate,
    time: paramTime,
    platform: paramPlatform,
    consultant,
  } = route.params || {};
  const usedConsultant = doctor || consultant;
  if (!usedConsultant) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Unable to load consultant details.</Text>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={commonStyles.buttonPrimary}>
          <Text style={commonStyles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialDate = paramDate
    ? new Date(paramDate)
    : getNextAvailableDate(usedConsultant.availableDays || []);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedConsultationHour, setSelectedConsultationHour] = useState(paramTime || null);
  const [selectedPlatform, setSelectedPlatform] = useState(paramPlatform || null);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const selectedAvailableDay = moment(selectedDate).tz('Asia/Manila').format('dddd');

  const fetchBookedTimes = useCallback(async ()=>{
    try{
      const q = query(
        collection(db,'appointmentRequests'),
        where('consultantId','==',usedConsultant.id),
        where('availableDay','==',selectedAvailableDay)
      );
      const snap = await getDocs(q);
      setBookedTimes(snap.docs.map(d=>d.data().consultationHour));
    }catch(err){
      Alert.alert('Error',err.message);
    }
  },[usedConsultant.id,selectedAvailableDay]);

  useEffect(()=>{
    if(usedConsultant.availableDays.includes(selectedAvailableDay)) fetchBookedTimes();
  },[selectedDate,fetchBookedTimes,usedConsultant.availableDays,selectedAvailableDay]);

  const handleDateChange = (e,date)=>{
    setShowDatePicker(false);
    if(date){
      const ph = moment(date).tz('Asia/Manila');
      const day = ph.format('dddd');
      if(usedConsultant.availableDays.includes(day)){
        setSelectedDate(ph.toDate());
        setSelectedConsultationHour(null);
      } else {
        Alert.alert('Invalid Day',`Available on: ${usedConsultant.availableDays.join(', ')}`);
      }
    }
  };

  const getAppointmentDateTime = (dateObj, hourStr)=>{
    const [time,mod] = hourStr.split(' ');
    let [h,m] = time.split(':').map(Number);
    if(mod==='PM'&&h<12) h+=12;
    if(mod==='AM'&&h===12) h=0;
    const dt = new Date(dateObj);
    dt.setHours(h,m,0,0);
    return dt;
  };

  const handleMakeAppointment = async()=>{
    if(!selectedConsultationHour||!selectedPlatform){
      return Alert.alert('Please select both a time and a platform.');
    }
    setIsBooking(true);
    try{
      const user = auth.currentUser;
      if(!user) throw new Error('Not logged in');
      const appointmentDateTime = getAppointmentDateTime(selectedDate, selectedConsultationHour);
      const udoc = await getDoc(doc(db,'users',user.uid));
      const fullName = user.displayName || udoc.data()?.fullName || 'User';
      await addDoc(collection(db,'appointmentRequests'),{
        consultantId: usedConsultant.id,
        consultantName: usedConsultant.name,
        userId: user.uid,
        fullName,
        date: appointmentDateTime,
        availableDay: selectedAvailableDay,
        consultationHour: selectedConsultationHour,
        platform: selectedPlatform,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Success','Appointment scheduled!',[
        {text:'OK', onPress:()=>navigation.navigate('ConsultantScreen')}
      ]);
    }catch(err){
      Alert.alert('Error',err.message);
    }finally{
      setIsBooking(false);
    }
  };

  const availableHours = (usedConsultant.consultationHours||[]).filter(h=>!bookedTimes.includes(h));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.specialtyText}>{usedConsultant.specialty}</Text>
          {usedConsultant.photoUrl&&(
            <Image source={{uri:usedConsultant.photoUrl}} style={styles.image}/>
          )}
          <Text style={styles.name}>{usedConsultant.name}</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>
              Date (Available: {usedConsultant.availableDays.join(', ')})
            </Text>
            <TouchableOpacity onPress={()=>setShowDatePicker(true)} style={styles.pickerButton}>
              <Text style={styles.pickerText}>
                {moment(selectedDate).tz('Asia/Manila').format('LL')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.selectionContainer}>
            <Text style={styles.label}>Select Time</Text>
            <Picker
              selectedValue={selectedConsultationHour}
              onValueChange={v=>setSelectedConsultationHour(v)}
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
          style={[commonStyles.buttonPrimary,{margin:20}]}
          onPress={handleMakeAppointment}
          disabled={isBooking}
        >
          {isBooking?(
            <ActivityIndicator color="#FFF"/>
          ):(
            <Text style={commonStyles.buttonText}>Book Appointment</Text>
          )}
        </TouchableOpacity>

        {showDatePicker&&(
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS==='ios'?'spinner':'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
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
  centered:{flex:1,justifyContent:'center',alignItems:'center',padding:20},
  errorText:{color:'red',fontSize:16,marginBottom:20},
  card:{...commonStyles.card,margin:20},
  specialtyText:{color:theme.colors.textSecondary,fontSize:theme.text.subheading,marginBottom:theme.spacing.lg},
  image:{width:120,height:120,borderRadius:60,alignSelf:'center',marginBottom:20},
  name:{fontSize:24,fontWeight:'bold',color:'#333',textAlign:'center',marginBottom:5},
  pickerContainer:{marginVertical:20},
  label:{fontSize:16,fontWeight:'600',color:'#444',marginBottom:10},
  pickerButton:{backgroundColor:'#FFF',borderRadius:10,padding:15,borderWidth:1,borderColor:'#E0E0E0'},
  pickerText:{fontSize:16,color:'#333'},
  selectionContainer:{marginBottom:20},
});
