import React from 'react';
import { View, Text, Image, StyleSheet, Button, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { db, auth } from '../firebaseConfig'; // Use the already-initialized instance
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { query, where, getDocs, setDoc } from 'firebase/firestore';

const ConsultantDetailScreen = ({ route, navigation }) => {
  const { consultant } = route.params;

  console.log('Consultant:', consultant); // Log to verify consultant data

  // Ensure consultant has necessary fields
  if (!consultant.id || !consultant.userId) {
    console.error("Consultant data is incomplete:", consultant);
    return null; // Or handle the error appropriately
  }

  const handleMakeAppointment = () => {
    if (!auth.currentUser) {
      Alert.alert("Not Logged In", "Please log in to make an appointment.");
      return;
    }
    navigation.navigate('AppointmentScreen', { consultant });
  };

  const handleChatNavigation = async () => {
    try {
      // Check if a chat already exists
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

      // Navigate to ChatScreen with chatId and consultant details
      navigation.navigate('Chat', { chatDetails: { chatId, consultant } });
    } catch (error) {
      console.error("Error navigating to chat:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: consultant.photoUrl }} style={styles.image} />
      <View style={styles.header}>
        <Text style={styles.name}>Dr. {consultant.name}</Text>
        <Text style={styles.specialty}>{consultant.specialty}</Text>
        <Text style={styles.sessionPrice}>₱500/session</Text>
      </View>
      <View style={styles.ratingContainer}>
        <Text style={styles.rating}>⭐ {consultant.rating || '5.0'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Doctor {consultant.name}</Text>
        <Text style={styles.sectionContent}>
          Doctor {consultant.name}, the son of a prominent local physician, recently graduated from the University of California, San Francisco School of Medicine with high honors. Read More
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.sectionContent}>{consultant.hospitalAddress}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointment Details</Text>
        <Text style={styles.sectionContent}>Available Days: {consultant.availableDays}</Text>
        <Text style={styles.sectionContent}>Consultation Hours: {consultant.consultationHours}</Text>
        <Text style={styles.sectionContent}>Platform: {consultant.platform}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.sectionContent}>Email: {consultant.email}</Text>
        <Text style={styles.sectionContent}>Phone: {consultant.contactInfo}</Text>
      </View>
      <Button title="Make Appointment" onPress={handleMakeAppointment} style={styles.appointmentButton} />
      <TouchableOpacity style={styles.chatButton} onPress={handleChatNavigation}>
        <Text style={styles.chatButtonText}>Chat with Consultant</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
  image: {
    width: '100%',
    height: 250,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  specialty: {
    fontSize: 18,
    color: '#666',
  },
  sessionPrice: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    marginTop: 5,
  },
  ratingContainer: {
    padding: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    color: '#FFD700',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
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
  appointmentButton: {
    margin: 20,
    backgroundColor: '#6bc4c1',
    color: '#fff',
  },
  chatButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF6F61',
    borderRadius: 10,
    alignItems: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ConsultantDetailScreen; 