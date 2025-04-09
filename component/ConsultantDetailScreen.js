import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { db, auth } from '../firebaseConfig'; // Use the already-initialized instance
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { query, where } from 'firebase/firestore';
import CustomHeader from './CustomHeader'; // Import the CustomHeader
import Ionicons from 'react-native-vector-icons/Ionicons';

const ConsultantDetailScreen = ({ route, navigation }) => {
  const { consultant } = route.params;
  const [rating, setRating] = useState(0);

  // Ensure consultant has necessary fields
  if (!consultant.id || !consultant.userId) {
    console.error("Consultant data is incomplete:", consultant);
    return null; // Or handle the error appropriately
  }

  const handleMakeAppointment = () => {
    console.log("Make Appointment button pressed.");
    if (!auth.currentUser) {
      Alert.alert("Not Logged In", "Please log in to make an appointment.");
      return;
    }
    navigation.navigate('AppointmentScreen', { consultant });
  };

  const handleChatNavigation = async () => {
    console.log("Chat with Consultant button pressed.");
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
      Alert.alert("Error", "Unable to navigate to chat. Please try again later.");
    }
  };

  // Rating submission function.
  const handleRatingSubmit = async () => {
    if (!auth.currentUser) {
      Alert.alert("Not Logged In", "Please log in to rate the consultant.");
      return;
    }
    if (rating <= 0) {
      Alert.alert("No Rating", "Please select a rating before submitting.");
      return;
    }
    try {
      // Create or update the rating document. Using a composite key to ensure one rating per user.
      const ratingDocId = consultant.id + '_' + auth.currentUser.uid;
      await setDoc(doc(db, 'ratings', ratingDocId), {
        consultantId: consultant.id,
        userId: auth.currentUser.uid,
        rating: rating,
        createdAt: new Date(),
      });
      Alert.alert("Thank you!", "Your rating has been submitted.");
    } catch (err) {
      console.error("Error submitting rating:", err);
      Alert.alert("Error", "Failed to submit rating. Please try again later.");
    }
  };

  // Helper function to format array fields for display
  const formatArray = (arr) => Array.isArray(arr) ? arr.join(', ') : arr;

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Consultant Details" navigation={navigation} />
      <ScrollView>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <Image 
            source={{ uri: consultant.photoUrl || 'https://via.placeholder.com/150' }} 
            style={styles.profileImage} 
          />
          <Text style={styles.name}>Dr. {consultant.name}</Text>
          <Text style={styles.specialty}>{consultant.specialty}</Text>
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
          <Text style={styles.sectionContent}>{consultant.hospitalAddress}</Text>
        </View>

        {/* Appointment Details Section */}
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

        {/* Contact Information Section */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.detailLabel}>Email:</Text> {consultant.email}
          </Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.detailLabel}>Phone:</Text> {consultant.contactInfo}
          </Text>
        </View>

        {/* Rating Section */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Rate this Consultant</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={30} color="#FFD700" />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.submitRatingButton} onPress={handleRatingSubmit}>
            <Text style={styles.buttonText}>Submit Rating</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
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
    padding: 15,
    backgroundColor: '#6bc4c1',
    borderRadius: 10,
    alignItems: 'center',
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
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
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
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  submitRatingButton: {
    backgroundColor: '#6bc4c1',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
});

export default ConsultantDetailScreen;
