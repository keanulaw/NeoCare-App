import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import moment from 'moment-timezone';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';

export default function AppointmentScreen({ route, navigation }) {
  const { doctor, date: paramDate, consultant } = route.params || {};
  const usedConsultant = doctor || consultant;
  const initialDate = paramDate
    ? new Date(paramDate)
    : getNextAvailableDate(usedConsultant?.availableDays || []);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedConsultationHour, setSelectedConsultationHour] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  if (!usedConsultant) return (
    <View style={styles.centered}><Text style={styles.errorText}>Unable to load details.</Text>
      <TouchableOpacity onPress={()=>navigation.goBack()} style={commonStyles.buttonPrimary}><Text style={commonStyles.buttonText}>Go Back</Text></TouchableOpacity>
    </View>
  );

  const selectedAvailableDay = moment(selectedDate).tz('Asia/Manila').format('dddd');

  const fetchBookedTimes = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'appointmentRequests'),
        where('consultantId','==',usedConsultant.id),
        where('availableDay','==',selectedAvailableDay)
      );
      const snap = await getDocs(q);
      setBookedTimes(snap.docs.map(d=>d.data().consultationHour));
    } catch(err) { Alert.alert('Error',err.message); }
  },[usedConsultant.id,selectedAvailableDay]);

  useEffect(()=>{ if(usedConsultant.availableDays.includes(selectedAvailableDay)) fetchBookedTimes(); },[selectedDate,fetchBookedTimes,usedConsultant.availableDays,selectedAvailableDay]);

  const handleDateChange=(e,date)=>{
    setShowDatePicker(false);
    if(date){ const ph=moment(date).tz('Asia/Manila'), day=ph.format('dddd');
      if(usedConsultant.availableDays.includes(day)){ setSelectedDate(ph.toDate()); setSelectedConsultationHour(null); }
      else Alert.alert('Invalid Day',`Available on ${usedConsultant.availableDays.join(', ')}`);
    }
  };

  const getAppointmentDateTime=(dateObj,hourStr)=>{
    const [time,mod]=hourStr.split(' ');
    let [h,m]=time.split(':').map(Number);
    if(mod==='PM'&&h<12)h+=12; if(mod==='AM'&&h===12)h=0;
    const dt=new Date(dateObj); dt.setHours(h,m,0,0); return dt;
  };

  const handleMakeAppointment=async()=>{
    if(!selectedConsultationHour||!selectedPlatform){ return Alert.alert('Select time and platform.'); }
    setIsBooking(true);
    try{
      const user=auth.currentUser; if(!user)throw new Error('Not logged in');
      const appointmentDateTime=getAppointmentDateTime(selectedDate,selectedConsultationHour);
      const udoc=await getDoc(doc(db,'users',user.uid));
      const fullName=user.displayName||udoc.data()?.fullName||'User';
      await addDoc(collection(db,'appointmentRequests'),{
        consultantId:usedConsultant.id, consultantName:usedConsultant.name, userId:user.uid,
        fullName, date:appointmentDateTime, availableDay:selectedAvailableDay,
        consultationHour:selectedConsultationHour, platform:selectedPlatform,
        status:'pending', createdAt:serverTimestamp(),
      });
      Alert.alert('Success','Appointment scheduled!',[{text:'OK',onPress:()=>navigation.navigate('ConsultantScreen')}]);
    }catch(err){ Alert.alert('Error',err.message); }
    finally{ setIsBooking(false); }
  };

  const availableHours=usedConsultant.consultationHours.filter(h=>!bookedTimes.includes(h));

  return(
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.specialtyText}>{usedConsultant.specialty}</Text>
          {usedConsultant.photoUrl&&<Image source={{uri:usedConsultant.photoUrl}} style={styles.image}/>}
          <Text style={styles.name}>{usedConsultant.name}</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Date (Available: {usedConsultant.availableDays.join(', ')})</Text>
            <TouchableOpacity onPress={()=>setShowDatePicker(true)} style={styles.pickerButton}>
              <Text style={styles.pickerText}>{moment(selectedDate).tz('Asia/Manila').format('LL')}</Text>
            </TouchableOpacity>
          </View>

          {availableHours.length? <View style={styles.selectionContainer}>
            <Text style={styles.label}>Select Time</Text>
            <View style={styles.optionsRow}>{availableHours.map((h,i)=>(
              <TouchableOpacity key={i} style={[styles.optionButton,selectedConsultationHour===h&&styles.optionButtonSelected]} onPress={()=>setSelectedConsultationHour(h)}>
                <Text style={[styles.optionText,selectedConsultationHour===h&&{color:'#fff'}]}>{h}</Text>
              </TouchableOpacity>
            ))}</View>
          </View>: <Text style={styles.noAvailableText}>No times for {selectedAvailableDay}</Text>}

          <View style={styles.selectionContainer}>
            <Text style={styles.label}>Platform</Text>
            <View style={styles.optionsRow}>{['Online','In Person'].map((opt,i)=>(
              <TouchableOpacity key={i} style={[styles.optionButton,selectedPlatform===opt&&styles.optionButtonSelected]} onPress={()=>setSelectedPlatform(opt)}>
                <Text style={[styles.optionText,selectedPlatform===opt&&{color:'#fff'}]}>{opt}</Text>
              </TouchableOpacity>
            ))}</View>
          </View>
        </View>

        <TouchableOpacity style={[commonStyles.buttonPrimary,{marginVertical:20}]} onPress={handleMakeAppointment} disabled={isBooking}>
          {isBooking?<ActivityIndicator color="#FFF"/>:<Text style={commonStyles.buttonText}>Book Appointment</Text>}
        </TouchableOpacity>

        {showDatePicker&&<DateTimePicker value={selectedDate} mode="date" display={Platform.OS==='ios'?'spinner':'default'} onChange={handleDateChange} minimumDate={new Date()}/>}
      </ScrollView>
    </SafeAreaView>
  );
}

const getNextAvailableDate = availableDays => {
  const ph=moment().tz('Asia/Manila'); let d=ph.clone().startOf('day');
  for(let i=0;i<7;i++){ if(availableDays.includes(d.format('dddd'))) return d.toDate(); d.add(1,'day'); }
  return ph.toDate();
};

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:'#FFF4E6'},
  centered:{flex:1,justifyContent:'center',alignItems:'center',padding:20},
  card:{...commonStyles.card,margin:20},
  specialtyText:{color:theme.colors.textSecondary,fontSize:theme.text.subheading,marginBottom:theme.spacing.lg},
  image:{width:120,height:120,borderRadius:60,alignSelf:'center',marginBottom:20},
  name:{fontSize:24,fontWeight:'bold',color:'#333',textAlign:'center',marginBottom:5},
  pickerContainer:{marginVertical:20},
  label:{fontSize:16,fontWeight:'600',color:'#444',marginBottom:10},
  pickerButton:{backgroundColor:'#FFF',borderRadius:10,padding:15,borderWidth:1,borderColor:'#E0E0E0'},
  pickerText:{fontSize:16,color:'#333'},
  selectionContainer:{marginBottom:20},
  optionsRow:{flexDirection:'row',flexWrap:'wrap'},
  optionButton:{backgroundColor:'#FFF',borderRadius:10,padding:10,borderWidth:1,borderColor:'#E0E0E0',margin:5},
  optionButtonSelected:{backgroundColor:'#D47FA6',borderColor:'#D47FA6'},
  optionText:{fontSize:16,color:'#333'},
  noAvailableText:{color:'#FF0000',fontSize:14,textAlign:'center'},
  errorText:{color:'red',fontSize:16,marginBottom:20,textAlign:'center'}
});
