// src/screens/ConsultantDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  writeBatch,
  setDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { query, where } from 'firebase/firestore';
import CustomHeader from './CustomHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import commonStyles from '../src/commonStyles';
import theme from '../src/theme';

const ConsultantDetailScreen = ({ route, navigation }) => {
  const { consultantId } = route.params;
  const [consultant, setConsultant] = useState(null);
  const [average, setAverage] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const cref = doc(db, 'consultants', consultantId);
        const snapC = await getDoc(cref);
        if (snapC.exists()) setConsultant({ id: snapC.id, ...snapC.data() });

        const bq = query(
          collection(db, 'bookings'),
          where('consultantId', '==', consultantId),
          where('rating', '>', 0)
        );
        const bSnap = await getDocs(bq);

        let sum = 0, count = 0, mine = null;
        bSnap.docs.forEach(d => {
          const data = d.data();
          sum += data.rating;
          count++;
          if (data.userId === auth.currentUser?.uid) {
            mine = data.rating;
          }
        });

        setAverage(count ? (sum / count).toFixed(1) : null);
        setUserRating(mine);
      } catch (e) {
        console.error('Detail fetch failed', e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [consultantId]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }
  if (!consultant) {
    return <Text style={styles.errorText}>Unable to load consultant.</Text>;
  }

  const handleMakeAppointment = () => {
    if (!auth.currentUser) {
      Alert.alert('Log in required', 'Please log in to book.');
      return;
    }
    navigation.navigate('AppointmentScreen', { consultant });
  };

  const handleChatNavigation = async () => {
    try {
      const participants = [auth.currentUser.uid, consultant.userId].sort();
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("participants", "==", participants));
      const snapshot = await getDocs(q);

      let chatId;
      if (!snapshot.empty) {
        chatId = snapshot.docs[0].id;
      } else {
        const newChatRef = doc(chatsRef);
        await setDoc(newChatRef, {
          participants,
          parentUid: auth.currentUser.uid,
          doctorUid: consultant.userId,
          createdAt: new Date(),
        });
        chatId = newChatRef.id;
      }

      navigation.navigate('Chat', { chatDetails: { chatId, consultant } });
    } catch (error) {
      console.error("Error navigating to chat:", error);
      Alert.alert("Error", "Unable to navigate to chat. Please try again later.");
    }
  };

  const formatArray = arr => Array.isArray(arr) ? arr.join(', ') : arr;

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Consultant Details" />
      <ScrollView>
        {/* Profile */}
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: consultant.profilePhoto }}         // <-- and here
            style={styles.profileImage}
          />
          <Text style={styles.name}>Dr. {consultant.name}</Text>
          <Text style={styles.specialty}>{consultant.specialty}</Text>
          {consultant.hourlyRate != null && (
            <Text style={styles.sessionPrice}>
              ₱{consultant.hourlyRate} per hour
            </Text>
          )}
        </View>

        {/* About Section */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>About Dr. {consultant.name}</Text>
          <Text style={styles.sectionContent}>
            Dr. {consultant.name} specializes in {consultant.specialty} and is dedicated to providing top-notch care. Registered on NeoCare, they offer both in-person and online consultations.
          </Text>
        </View>

        {/* Location Section */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.sectionContent}>
            {consultant.birthCenterAddress || 'No location provided'}
          </Text>
        </View>

        {/* Appointment Details */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.detailLabel}>Available Days:</Text> {formatArray(consultant.availableDays)}
          </Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.detailLabel}>Consultation Hours:</Text> {formatArray(consultant.consultationHours)}
          </Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.detailLabel}>Platform:</Text> {formatArray(consultant.platform)}
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.detailLabel}>Email:</Text> {consultant.email}
          </Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.detailLabel}>Phone:</Text> {consultant.contactInfo}
          </Text>
        </View>

        {/* Ratings */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Average Rating</Text>
          <Text style={[styles.sectionContent, { fontSize: 20 }]}>
            {average != null ? `⭐ ${average}` : 'No ratings yet'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.appointmentButton} onPress={handleMakeAppointment}>
            <Text style={styles.buttonText}>Make Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} onPress={handleChatNavigation}>
            <Text style={styles.buttonText}>Chat with Consultant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF4E6' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { flex: 1, textAlign: 'center', marginTop: 20 },

  profileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  specialty: { fontSize: 18, color: '#666' },
  sessionPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 6,
  },

  detailCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  appointmentButton: {
    marginHorizontal: 8,
    padding: 15,
    backgroundColor: '#6bc4c1',
    borderRadius: 10,
    alignItems: 'center',
  },
  chatButton: {
    marginHorizontal: 8,
    padding: 15,
    backgroundColor: '#FF6F61',
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
export default ConsultantDetailScreen;

