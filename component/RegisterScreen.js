import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure you have this import
import app from '../firebaseConfig'; // Ensure this import is correct
import DateTimePicker from '@react-native-community/datetimepicker';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const auth = getAuth(app); // Pass the app instance here

  const validateForm = () => {
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords do not match.');
      return false;
    }
    // Ensure dueDate is in the future
    if (!dueDate || dueDate <= new Date()) {
      Alert.alert('Invalid Due Date', 'Please select a valid future due date.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user information in Firestore with UID as document ID
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        fullName: fullName,
        email: email,
        dueDate: dueDate,  // Stores the selected due date
      });

      Alert.alert('Success', 'User registered successfully!');
      navigation.navigate('Login'); // Navigate to Login screen
    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert('Registration Error', `Failed to register. ${error.message}`);
    }
  };

  const onChangeDueDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep picker open on iOS if needed
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Mom-to-Be!</Text>
      <Text style={styles.subtitle}>Create Your Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      
      <TouchableOpacity 
        style={styles.dateButton} 
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {dueDate ? `Due Date: ${dueDate.toLocaleDateString()}` : 'Select Due Date'}
        </Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDueDate}
          minimumDate={new Date()}
        />
      )}
      
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already have an Account?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF4E6',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#D47FA6',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#A9A9A9',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#D47FA6',
    padding: 10,
    marginBottom: 20,
  },
  dateButton: {
    backgroundColor: '#D47FA6',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF6F61',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#FF6F61',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default RegisterScreen; 